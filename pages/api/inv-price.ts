import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types'
import { getProvider } from '@app/util/providers'
import { inverseViewer } from '@app/util/viewer'

const cacheKey = `inv-price-v1.0.0`;

export default async function handler(req, res) {
    const { cacheFirst } = req.query;
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    try {
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const viewer = inverseViewer(getProvider(NetworkIds.mainnet));
        const invPrice = await viewer.tokens.getInvPrice();

        const prices = {
            'inverse-finance': invPrice,            
        }

        await redisSetWithTimestamp(cacheKey, prices);

        res.status(200).json(prices)
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
            res.status(500).json({ success: false });
        }
    }
}