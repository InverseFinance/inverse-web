import "source-map-support";
import { getCacheFromRedis } from '@app/util/redis';
import { repaymentsCacheKeyV2 } from "./repayments-v2";

export default async function handler(req, res) {
    const { cacheFirst, ignoreCache } = req.query;    
    try {
        const resultData = await fetch(`https://inverse.finance/api/transparency/repayments-v2?cacheFirst=${cacheFirst}&ignoreCache=${ignoreCache}`);
        res.status(200).json(await resultData.json());
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(repaymentsCacheKeyV2, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            } else {
                res.status(500).json({ error: true });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ error: true });
        }
    }
};