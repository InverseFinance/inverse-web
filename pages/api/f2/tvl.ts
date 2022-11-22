
import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { F2_POSITIONS_CACHE_KEY } from './firm-positions';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';

export default async function handler(req, res) {
    const cacheKey = 'f2-tvl-v1.0.0'
    try {
        const cache = await getCacheFromRedis(cacheKey, true, 30);
        if (cache) {
            res.status(200).json(cache);
            return
        }

        const positionsCache = await getCacheFromRedis(F2_POSITIONS_CACHE_KEY, false);
        if (!positionsCache) {
            res.status(200).json({ firmTotalTvl: 0, firmTvls:[] });
            return
        }

        const marketsCache = await getCacheFromRedis(F2_MARKETS_CACHE_KEY, false);
        if (!marketsCache) {
            res.status(200).json({ firmTotalTvl: 0, firmTvls:[] });
            return
        }
        let tvl = 0;
        const marketTvls = {};

        positionsCache.positions.forEach(p => {
            const market = marketsCache.markets[p.marketIndex];
            const worth = market.price * p.deposits;
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
            timestamp: Math.min(marketsCache.timestamp, positionsCache.timestamp),
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
            } else {
                res.status(500).json({ success: false });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false });
        }
    }
}