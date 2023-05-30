import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getTokenData } from '@app/util/livecoinwatch';

export const cacheKey = `dola-market-v1.0.0`;

export default async function handler(req, res) {
    const { cacheFirst } = req.query;

    try {
        const cacheDuration = 300;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const data = await getTokenData('DOLA');

        const resultData = {
            timestamp: (+(new Date())-1000),
            // cg backward compat
            market_data: { ...data, total_volume: { usd: data.volume } },
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