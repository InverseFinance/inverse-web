import "source-map-support";
import { getNetworkConfig } from '@app/util/networks';
import { getCacheFromRedis, getRedisClient, redisSetWithTimestamp } from '@app/util/redis';

export default async function handler(req, res) { 
    const cacheKey = `frontier-positions-v2`;

    try {
        const cacheDuration = 600;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
        if(validCache) {
          res.status(200).json(validCache);
          return
        }         

        const { meta, positionDetails: positions } = validCache;

        const resultData = {
            ...meta,
            nbPositions: positions.length,
            positions: positions,
        };

        res.status(200).json(resultData);
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
            res.status(500).json({ error: true });
        }
    }
};
