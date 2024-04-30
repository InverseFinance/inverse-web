import "source-map-support";
import { getCacheFromRedis } from '@app/util/redis';
import { ONE_DAY_SECS } from "@app/config/constants";

export default async function handler(req, res) { 
    const cacheKey = `frontier-positions-v2`;

    try {
        const cacheDuration = ONE_DAY_SECS;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, false, cacheDuration);
        if(validCache) {
          res.status(200).json(validCache);
          return
        }
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
