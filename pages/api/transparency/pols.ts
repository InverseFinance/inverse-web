import { Contract } from 'ethers'
import 'source-map-support'
import { ERC20_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Multisig, NetworkIds, Token } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { fedOverviewCacheKey } from './fed-overview';
import { getLPBalances, getUniV3PositionsOf } from '@app/util/contracts';
import { pricesCacheKey } from '../prices';
import { PROTOCOL_IMAGES } from '@app/variables/images';

const PROTOCOLS = Object.fromEntries(
    Object
        .entries(PROTOCOL_IMAGES)
        .map(([key, value]) => [value, key])
);

export default async function handler(req, res) {

    const { TREASURY, MULTISIGS } = getNetworkConfigConstants(NetworkIds.mainnet);
    const cacheKey = `pols-v1.0.0`;

    try {
        const validCache = await getCacheFromRedis(cacheKey, true, 300);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

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
        ]

        const TWG = multisigsToShow.find(m => m.shortName === 'TWG')!;

        const univ3TWGpositions = await getUniV3PositionsOf(getProvider('1'), TWG.address);

        const chainTWG: { [key: string]: Multisig } = {
            [NetworkIds.mainnet]: TWG,
            [NetworkIds.ftm]: multisigsToShow.find(m => m.shortName === 'TWG on FTM')!,
            [NetworkIds.optimism]: multisigsToShow.find(m => m.shortName === 'TWG on OP')!,
            [NetworkIds.bsc]: multisigsToShow.find(m => m.shortName === 'TWG on BSC')!,
        }

        const fedPols = fedsOverviewCache?.fedOverviews || [];

        const prices = (await getCacheFromRedis(pricesCacheKey, false)) || {};

        const getPol = async (lp: Token & { chainId: string }) => {
            const fedPol = fedPols.find(f => {
                return f?.strategy?.pools?.[0]?.address === lp.address
            });
            const provider = getProvider(lp.chainId);

            const subBalances = fedPol?.subBalances || (await getLPBalances(lp, lp.chainId, provider));

            const isDolaMain = lp.symbol.includes('DOLA');
            const tvl = subBalances.reduce((prev, curr) => prev + curr.balance * (prices[curr.coingeckoId || curr.symbol] || 1), 0);
            const mainPart = subBalances.find(d => d.symbol === (isDolaMain ? 'DOLA' : 'INV'));

            let ownedAmount = 0
            if (!fedPol) {
                const contract = new Contract(lp.lpBalanceContract || lp.address, ERC20_ABI, provider);
                const owned: { [key: string]: number } = {};
                if (!lp.isUniV3) {
                    owned.twg = getBnToNumber(await contract.balanceOf(chainTWG[lp.chainId].address));
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
                ownedAmount = Object.values(owned).reduce((prev, curr) => prev + curr, 0) * (prices[lp.coingeckoId || lp.symbol] || 1);
            } else {
                ownedAmount = fedPol.supply;
            }
            const dolaWorth = (mainPart?.balance || 0) * (prices[isDolaMain ? 'dola-usd' : 'inverse-finance'] || 1);

            return {
                ...lp,
                protocol: PROTOCOLS[lp.protocolImage],
                tvl,
                ownedAmount,
                perc: ownedAmount / tvl * 100,
                pairingDepth: tvl - dolaWorth,
                dolaBalance: dolaWorth,
                dolaWeight: dolaWorth / tvl * 100,
            }
        }

        const pols = (await Promise.all([
            ...lps.map(lp => getPol(lp))
        ]))

        const resultData = {
            timestamp: +(new Date()),
            pols,
        }
        await redisSetWithTimestamp(cacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
        }
    }
}