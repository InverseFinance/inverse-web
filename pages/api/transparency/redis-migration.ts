import 'source-map-support'
import { getCacheFromRedis, migratePureKeys } from '@app/util/redis'

export default async function handler(req, res) {
    const { k } = req.query;
    if(process.env.API_SECRET_KEY !== k) {
        return res.status(401).json({ success: false, msg: 'Unauthorized' });
    }
    try {
        await migratePureKeys();
        // await migrateOtherKeys();
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).send(cache);
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false });
        }
    }
}