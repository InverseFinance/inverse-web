import { Contract } from 'ethers'
import 'source-map-support'
import { ERC20_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Multisig, NetworkIds, Token } from '@app/types';
import { getBnToNumber, getYieldOppys } from '@app/util/markets'
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { fedOverviewCacheKey } from './fed-overview';
import { getLPBalances, getUniV3PositionsOf } from '@app/util/contracts';
import { pricesCacheKey } from '../prices';
import { PROTOCOLS_BY_IMG } from '@app/variables/images';
import { NETWORKS_BY_CHAIN_ID } from '@app/config/networks';

export const liquidityCacheKey = `liquidity-v1.0.8`;

const PROTOCOL_DEFILLAMA_MAPPING = {
    "VELO": 'velodrome',
    "VELOV2": 'velodrome-v2',
    "THENA": 'thena-v1',
    "THENAV2": 'thena-v2',
    "AURA": 'aura',
    "CRV": 'curve',
    "YFI": 'yearn',
    "CVX": "convex-finance",
    "SUSHI": "sushiswap",
    "UNI": "uniswap-v2",
    "UNIV3": "uniswap-v3",
    "BAL": "balancer-v2",
    "RAMSES": "ramses-v1",
    // TODO: check if correct project names for the following when defillama adds support    
    "STERLING": "sterling-exchange",
    "SOLIDLIZARD": "solidlizard",
    "SATIN": "satin-exchange",
    "ARCHLY": "archly-exchange",
    "PEARL": "pearl-exchange",
}

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const { TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);

    try {
        const cacheDuration = 60;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(liquidityCacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        // TODO: refacto as service
        // refresh Fed overview data & prices
        await Promise.all([
            fetch('https://www.inverse.finance/api/transparency/fed-overview'),
            // fetch('https://www.inverse.finance/api/prices'),
        ]);
        const fedsOverviewCache = await getCacheFromRedis(fedOverviewCacheKey, false);

        const multisigsToShow = MULTISIGS;
        // POL
        const lps = [
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.mainnet]).filter(({ isLP }) => isLP)
                .map((lp) => ({ chainId: NetworkIds.mainnet, ...lp })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.optimism]).filter(({ isLP }) => isLP)
                .map((lp) => ({ chainId: NetworkIds.optimism, ...lp })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.bsc]).filter(({ isLP }) => isLP)
                .map((lp) => ({ chainId: NetworkIds.bsc, ...lp })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.arbitrum]).filter(({ isLP }) => isLP)
                .map((lp) => ({ chainId: NetworkIds.arbitrum, ...lp })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.polygon]).filter(({ isLP }) => isLP)
                .map((lp) => ({ chainId: NetworkIds.polygon, ...lp })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.avalanche]).filter(({ isLP }) => isLP)
                .map((lp) => ({ chainId: NetworkIds.avalanche, ...lp })),
            ...Object
                .values(CHAIN_TOKENS[NetworkIds.ftm]).filter(({ isLP }) => isLP)
                .map((lp) => ({ chainId: NetworkIds.ftm, ...lp })),
        ]

        const TWG = multisigsToShow.find(m => m.shortName === 'TWG')!;

        const [univ3TWGpositions, yields] = await Promise.all([
            getUniV3PositionsOf(getProvider('1'), TWG.address),
            getYieldOppys(),
        ]);

        const chainTWG: { [key: string]: Multisig } = {
            [NetworkIds.mainnet]: TWG,
            [NetworkIds.ftm]: multisigsToShow.find(m => m.shortName === 'TWG on FTM')!,
            [NetworkIds.optimism]: multisigsToShow.find(m => m.shortName === 'TWG on OP')!,
            [NetworkIds.bsc]: multisigsToShow.find(m => m.shortName === 'TWG on BSC')!,
            [NetworkIds.arbitrum]: multisigsToShow.find(m => m.shortName === 'TWG on ARB 1')!,
            [NetworkIds.polygon]: multisigsToShow.find(m => m.shortName === 'TWG on PLG')!,
            [NetworkIds.avalanche]: multisigsToShow.find(m => m.shortName === 'TWG on AVAX')!,
        }

        const fedPols = fedsOverviewCache?.fedOverviews || [];

        const prices = (await getCacheFromRedis(pricesCacheKey, false)) || {};

        const getPol = async (lp: Token & { chainId: string }) => {
            // final protocol in the Fed strategy for the lp
            const fedPol = fedPols.find(f => {
                return f?.strategy?.pools?.[f?.strategy?.pools?.length - 1]?.address?.toLowerCase() === lp.address?.toLowerCase();
            });
            // case where Fed has an LP that is then staked in a protocol, relatedFedPol is the original protocol for the lp
            const relatedFedPol = fedPols.find(f => {
                return !!f?.strategy?.pools?.find(p => p.address?.toLowerCase() === lp.address?.toLowerCase());
            });
            const fedPolData = fedPol || relatedFedPol;

            const provider = getProvider(lp.chainId);
            const protocol = PROTOCOLS_BY_IMG[lp.protocolImage];
            const defiLlamaProjectName = PROTOCOL_DEFILLAMA_MAPPING[protocol];

            const yieldData = yields.find(y => {
                return defiLlamaProjectName === y.project
                    && y.underlyingTokens.join(',').toLowerCase() === lp.pairs?.join(',').toLowerCase();
            });

            const subBalances = fedPol?.subBalances || (await getLPBalances(lp, lp.chainId, provider));

            const isDolaMain = lp.symbol.includes('DOLA');
            const virtualTotalSupply = subBalances.reduce((prev, curr) => prev + curr.balance, 0);
            const srcTvl = subBalances.reduce((prev, curr) => prev + curr.balance * (prices[curr.coingeckoId || curr.symbol] || 1), 0);
            const tvl = yieldData?.tvlUsd || srcTvl;
            const virtualLpPrice = tvl / virtualTotalSupply;
            const mainPart = subBalances.find(d => d.symbol === (isDolaMain ? 'DOLA' : 'INV'));
            const dolaWorth = (mainPart?.balance || 0) * (prices[isDolaMain ? 'dola-usd' : 'inverse-finance'] || 1);
            const dolaPerc = dolaWorth / srcTvl;

            let ownedAmount = 0;
            const owned: { [key: string]: number } = {};
            if (!fedPolData) {
                const contract = new Contract(lp.lpBalanceContract || lp.address, ERC20_ABI, provider);
                if (lp.isCrvLP && !!lp.poolAddress) {
                    const [lpBal, lpSupply] = await Promise.all([
                        contract.balanceOf(TWG.address),
                        contract.totalSupply(),
                    ]);
                    const share = getBnToNumber(lpBal) / getBnToNumber(lpSupply);
                    owned.twg = share * tvl;
                } else if (!lp.isUniV3) {
                    owned.twg = getBnToNumber(await contract.balanceOf(lp.twgAddress || chainTWG[lp.chainId].address));
                    if (lp.chainId === NetworkIds.mainnet) {
                        // no more
                        // owned.bondsManager = getBnToNumber(await contract.balanceOf(OP_BOND_MANAGER));
                        owned.treasuryContract = getBnToNumber(await contract.balanceOf(TREASURY));
                    }
                } else {
                    // univ3 pool liquidity
                    const univ3liquidity = getBnToNumber(await (new Contract(lp.address, ['function liquidity() public view returns (uint)'], provider)).liquidity());
                    // share of twg
                    const univ3liquidityOwnedByTWG = univ3TWGpositions
                        .filter(p => p.token0 === lp.pairs[0] && p.token1 === lp.pairs[1])
                        .reduce((prev, curr) => prev + getBnToNumber(curr.liquidity), 0);
                    const share = univ3liquidity ? univ3liquidityOwnedByTWG / univ3liquidity : 0;
                    owned.twg = share * tvl;
                }
                ownedAmount = Object.values(owned).reduce((prev, curr) => prev + curr, 0)
                    * (lp.isStable ? virtualLpPrice : (prices[lp.coingeckoId || lp.symbol] || 1));
            } else {
                ownedAmount = fedPolData.lpBalance * fedPolData.lpPrice;
            }

            const lpName = lp.symbol.replace(/(-LP|-SLP|-AURA| [a-zA-Z]*lp)/ig, '').replace(/-ETH/ig, '-WETH');
            const perc = Math.min(ownedAmount / tvl * 100, 100);

            // bb-e-usd exception due to euler exploit to not throw off avgs
            const apy = lpName.toLowerCase().includes('-bb-e') ? 0 : yieldData?.apy;

            return {
                ...lp,
                lpName,
                apy,
                apyMean30d: yieldData?.apyMean30d,
                protocol,
                project: defiLlamaProjectName || protocol,
                networkName: NETWORKS_BY_CHAIN_ID[lp.chainId].name,
                tvl,
                owned,
                ownedAmount,
                perc,
                pairingDepth: tvl - (tvl * dolaPerc),
                dolaBalance: tvl * dolaPerc,
                dolaWeight: dolaPerc * 100,
                rewardDay: ownedAmount * (apy || 0) / 100 / 365,
                isFed: !!fedPol,
                // subBalances,
            }
        }

        const liquidity = (await Promise.all([
            ...lps.map(lp => getPol(lp))
        ]))

        const resultData = {
            timestamp: (+(new Date()) - 1000),
            liquidity,
        }
        await redisSetWithTimestamp(liquidityCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(liquidityCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
        }
    }
}