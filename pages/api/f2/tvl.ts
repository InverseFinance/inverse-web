
import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getFirmMarketUsers } from './firm-positions';
import { getPaidProvider, getProvider } from '@app/util/providers';
import { CHAIN_ID } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';
import { Contract } from 'ethers';
import { getBnToNumber } from '@app/util/markets';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { F2_ESCROW_ABI, F2_MARKET_ABI } from '@app/config/abis';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';
import { getMulticallOutput } from '@app/util/multicall';

const { F2_MARKETS } = getNetworkConfigConstants();

export const firmTvlCacheKey = 'f2-tvl-v1.0.3'

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    try {
        const cacheDuration = 60;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedTvl, isValid: isCachedTvlValid } = await getCacheFromRedisAsObj(firmTvlCacheKey, cacheFirst !== 'true', cacheDuration);
        if (cachedTvl && isCachedTvlValid) {
            res.status(200).json(cachedTvl);
            return
        }

        const provider = getProvider(CHAIN_ID);
        const paidProvider = getPaidProvider(1);

        const { firmMarketUsers, marketUsersAndEscrows } = await getFirmMarketUsers(paidProvider);

        // trigger
        fetch('https://inverse.finance/api/f2/fixed-markets');

        const { data: marketsCache } = await getCacheFromRedisAsObj(F2_MARKETS_CACHE_KEY, false);
        if (!marketsCache) {
            res.status(200).json(cachedTvl || { firmTotalTvl: 0, firmTvls: [] });
            return
        }

        let tvl = 0;
        const marketTvls = {};

        const depositsBn = await getMulticallOutput(
            firmMarketUsers.map((f, i) => {
                const marketAd = F2_MARKETS[f.marketIndex].address;
                const users = marketUsersAndEscrows[marketAd].users;
                const escrow = new Contract(marketUsersAndEscrows[marketAd].escrows[users.indexOf(f.user)], F2_ESCROW_ABI, provider);
                return { contract: escrow, functionName: 'balance' };
            })
        )
        const deposits = depositsBn.map((bn, i) => getBnToNumber(bn, getToken(CHAIN_TOKENS[CHAIN_ID], F2_MARKETS[firmMarketUsers[i].marketIndex].collateral)?.decimals));

        firmMarketUsers.forEach((p, i) => {
            const market = marketsCache.markets[p.marketIndex];
            const worth = market.price * deposits[i];
            tvl += worth;
            if (!marketTvls[p.marketIndex]) {
                marketTvls[p.marketIndex] = 0;
            }
            marketTvls[p.marketIndex] += worth;
        });

        const resultData = {
            firmTotalTvl: tvl,
            firmTvls: Object.entries(marketTvls).map(([marketIndex, tvl]) => {
                const market = marketsCache.markets[marketIndex];
                return {
                    tvl,
                    market: { name: market.name, address: market.address, underlying: market.underlying }
                }
            }),
            timestamp: +(new Date()),
        }

        await redisSetWithTimestamp(firmTvlCacheKey, resultData);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(firmTvlCacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ success: false });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false });
        }
    }
}