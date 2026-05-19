import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { treasuryAssetsSnapshotsCacheKey } from './treasury-assets';

export default async function handler(req, res) {
    const cacheDuration = 43200;
    const { cacheFirst } = req.query;
    
    const cacheKey = `runway-histo-v1.0.0`;

    try {
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst === 'true', cacheDuration);

        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const [snapshotsData] = await Promise.all([
            getCacheFromRedis(treasuryAssetsSnapshotsCacheKey, false),
        ]);

        const resultData = {
            timestamp: Date.now(),
            evolution: snapshotsData?.dailyValues || [],
        }
        await redisSetWithTimestamp(cacheKey, resultData, true);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false, cacheDuration, true);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
        }
    }
}