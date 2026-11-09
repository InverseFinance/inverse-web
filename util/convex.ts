import { BigNumber, Contract } from 'ethers';
import { formatUnits, parseUnits } from 'ethers/lib/utils';
import { BaseProvider } from '@ethersproject/providers';
import { getGroupedMulticallOutputs } from '@app/util/multicall';

// APRs of Convex pools as shown by the Convex UI, same methodology as the stable-yields-ui:
// the base Curve vAPR plus the CRV, CVX and extra reward streams of the pool's Convex reward contract
const CONVEX_POOLS_API = 'https://curve.convexfinance.com/api/curve/pools';
const CONVEX_APYS_API = 'https://curve.convexfinance.com/api/curve-apys';
const LLAMA_PRICES_API = 'https://coins.llama.fi/prices/current';
const CRV = '0xD533a949740bb3306d119CC777fa900bA034cd52';
const CVX = '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B';
const SECONDS_PER_YEAR = 31536000;
const REQUEST_TIMEOUT_MS = 10000;
// a pool under this tvl, shut down or broken has no meaningful APR (the stable-yields-ui does not list it)
const MIN_POOL_TVL_USD = 1000000;
// ConvexToken mints less CVX per CRV at each supply cliff
const CVX_MAX_SUPPLY = parseUnits('100000000', 18);
const CVX_TOTAL_CLIFFS = 1000;

type ConvexApiPool = {
    // `${chain}-${lowercase pool address}`, also the pool's key in the APYs API
    id: string;
    // tvl of the Curve pool
    usdTotal: number;
    isBroken?: boolean;
    convexPoolData: {
        crvRewards: string;
        shutdown: boolean;
        // amount staked on Convex
        usdTotal: number;
    };
}

type ConvexApiApys = {
    // base Curve vAPR, in %
    baseApy?: number;
    crvPrice?: number;
}

type RewardStream = { rewardRate: BigNumber | null, periodFinish: BigNumber | null };

const fetchJson = async (url: string) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) {
        throw new Error(`${url} status ${res.status}`);
    }
    return res.json();
}

// one function per contract: the multicall finds the function to call by a partial name
const callRequest = (address: string, signature: string, provider: BaseProvider, params: any[] = [], fallbackValue?: any) => {
    return {
        contract: new Contract(address, [`function ${signature}`], provider),
        functionName: signature.slice(0, signature.indexOf('(')),
        params,
        fallbackValue,
    };
}

const multicall = (groups: ReturnType<typeof callRequest>[][], provider: BaseProvider) => {
    return getGroupedMulticallOutputs(groups, 1, undefined, provider, true) as Promise<any[][]>;
}

const isStreaming = (stream: RewardStream) => !!stream.periodFinish && stream.periodFinish.toNumber() * 1000 > Date.now();

const getStreamApr = (stream: RewardStream, decimals: number, price: number, tvl: number) => {
    return isStreaming(stream) && !!stream.rewardRate && tvl > 0 ?
        parseFloat(formatUnits(stream.rewardRate, decimals)) * SECONDS_PER_YEAR * price / tvl * 100
        : 0;
}

const getCvxPerCrv = (cvxSupply: BigNumber) => {
    const cliff = cvxSupply.div(CVX_MAX_SUPPLY.div(CVX_TOTAL_CLIFFS)).toNumber();
    return cliff < CVX_TOTAL_CLIFFS ? (CVX_TOTAL_CLIFFS - cliff) / CVX_TOTAL_CLIFFS : 0;
}

// total APR in % of the Convex pools by reward contract (lowercase address):
// 0 for a pool without a meaningful APR, undefined for a reward contract unknown to Convex
export const getConvexPoolsAprs = async (rewardContracts: string[], provider: BaseProvider): Promise<{ [rewardContract: string]: number | undefined }> => {
    const [{ pools }, { apys }]: [{ pools: ConvexApiPool[] }, { apys: { [poolId: string]: ConvexApiApys } }] = await Promise.all([
        fetchJson(CONVEX_POOLS_API),
        fetchJson(CONVEX_APYS_API),
    ]);
    const apysByPoolId: { [poolId: string]: ConvexApiApys } = Object.fromEntries(Object.entries(apys).map(([id, a]) => [id.toLowerCase(), a]));
    const contracts = rewardContracts.map(ad => ad.toLowerCase());
    const convexPools = contracts.map(ad => pools.find(p => p.convexPoolData?.crvRewards?.toLowerCase() === ad));
    const isListed = (p?: ConvexApiPool): p is ConvexApiPool => !!p && !p.convexPoolData.shutdown && !p.isBroken && p.usdTotal >= MIN_POOL_TVL_USD;
    const listedPools = convexPools.filter(isListed);

    const rewardsAprs = await getRewardsAprs(listedPools, apysByPoolId, provider);

    return Object.fromEntries(contracts.map((ad, i) => {
        const pool = convexPools[i];
        if (!isListed(pool)) {
            return [ad, pool ? 0 : undefined];
        }
        return [ad, (apysByPoolId[pool.id.toLowerCase()]?.baseApy || 0) + rewardsAprs[listedPools.indexOf(pool)]];
    }));
}

// current reward APRs as shown by the Convex UI: CRV, CVX minted with it and the active extra rewards, valued over the amount staked on Convex
const getRewardsAprs = async (pools: ConvexApiPool[], apys: { [poolId: string]: ConvexApiApys }, provider: BaseProvider): Promise<number[]> => {
    if (!pools.length) {
        return [];
    }
    const rewardContracts = pools.map(p => p.convexPoolData.crvRewards);
    const [rewardRates, periodFinishes, extrasLengths, [cvxSupply]] = await multicall([
        rewardContracts.map(ad => callRequest(ad, 'rewardRate() view returns (uint256)', provider)),
        rewardContracts.map(ad => callRequest(ad, 'periodFinish() view returns (uint256)', provider)),
        rewardContracts.map(ad => callRequest(ad, 'extraRewardsLength() view returns (uint256)', provider)),
        [callRequest(CVX, 'totalSupply() view returns (uint256)', provider)],
    ], provider);

    // extra reward contracts of each pool
    const extraIndexes = rewardContracts.flatMap((ad, poolIndex) => {
        return Array.from({ length: extrasLengths[poolIndex]?.toNumber() || 0 }, (_, i) => ({ poolIndex, rewardContract: ad, i }));
    });
    const [extraContracts] = extraIndexes.length ? await multicall([
        extraIndexes.map(e => callRequest(e.rewardContract, 'extraRewards(uint256) view returns (address)', provider, [e.i])),
    ], provider) : [[]];
    const extras = extraIndexes
        .map((e, i) => ({ poolIndex: e.poolIndex, address: extraContracts[i] as string }))
        .filter(e => !!e.address);
    const [extraRewardRates, extraPeriodFinishes, extraRewardTokens] = extras.length ? await multicall([
        extras.map(e => callRequest(e.address, 'rewardRate() view returns (uint256)', provider)),
        extras.map(e => callRequest(e.address, 'periodFinish() view returns (uint256)', provider)),
        extras.map(e => callRequest(e.address, 'rewardToken() view returns (address)', provider)),
    ], provider) : [[], [], []];

    // only the extra rewards still streaming, an extra reward that can't be read is left out
    const activeExtras = extras
        .map((e, i) => ({ ...e, rewardRate: extraRewardRates[i], periodFinish: extraPeriodFinishes[i], rewardToken: extraRewardTokens[i] as string }))
        .filter(e => !!e.rewardToken && isStreaming(e));
    // reward tokens of Convex stashes can be wrapped, the wrapper exposes the underlying token
    const [underlyingTokens] = activeExtras.length ? await multicall([
        activeExtras.map(e => callRequest(e.rewardToken, 'token() view returns (address)', provider, [], e.rewardToken)),
    ], provider) : [[]];
    const [tokensDecimals] = activeExtras.length ? await multicall([
        activeExtras.map((e, i) => callRequest(underlyingTokens[i] || e.rewardToken, 'decimals() view returns (uint8)', provider)),
    ], provider) : [[]];
    const readableExtras = activeExtras
        .map((e, i) => ({ ...e, token: String(underlyingTokens[i] || e.rewardToken).toLowerCase(), decimals: tokensDecimals[i] as number | null }))
        .filter(e => typeof e.decimals === 'number');

    const tokens = [CRV, CVX, ...readableExtras.map(e => e.token)].map(ad => `ethereum:${ad.toLowerCase()}`);
    const { coins } = await fetchJson(`${LLAMA_PRICES_API}/${Array.from(new Set(tokens)).join(',')}`);
    const prices: { [token: string]: number } = Object.fromEntries(Object.entries(coins).map(([key, coin]: [string, any]) => [key.split(':')[1].toLowerCase(), coin.price]));
    // the Convex UI values CRV rewards with the CRV price of its APYs API
    const crvPrice = Object.values(apys).find(a => a.crvPrice)?.crvPrice || prices[CRV.toLowerCase()];
    if (!crvPrice) {
        throw new Error('Missing CRV price');
    }
    // CVX is minted pro rata of the CRV rewards
    const cvxValuePerCrvValue = (cvxSupply ? getCvxPerCrv(cvxSupply) : 0) * (prices[CVX.toLowerCase()] || 0) / crvPrice;

    return pools.map((p, poolIndex) => {
        const tvl = p.convexPoolData.usdTotal;
        const crvApr = getStreamApr({ rewardRate: rewardRates[poolIndex], periodFinish: periodFinishes[poolIndex] }, 18, crvPrice, tvl);
        const cvxApr = crvApr * cvxValuePerCrvValue;
        const extrasApr = readableExtras
            .filter(e => e.poolIndex === poolIndex)
            .reduce((sum, e) => sum + getStreamApr(e, e.decimals as number, prices[e.token] || 0, tvl), 0);
        return crvApr + cvxApr + extrasApr;
    });
}
