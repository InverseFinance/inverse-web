import 'source-map-support'
import { getCacheFromRedis } from '@app/util/redis'

export default async function handler(req, res) {
    try {
        const validCache = await getCacheFromRedis('liquidity-history', false, 0, true);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }
        
        res.status(400).json({ msg: 'liquidity-history not initialized' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'ko' });
    }
}