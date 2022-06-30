import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getFrontierLiquidations } from '@app/util/the-graph'

export default async function handler(req, res) {
  const { borrower } = req.query;
  const cacheKey = `${borrower.toLowerCase()||''}-liquidations-v1.0.0`;

  try {

    const validCache = await getCacheFromRedis(cacheKey, true, 10);

    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const result = await getFrontierLiquidations({
        borrower: borrower||''
    });

    if(!borrower) {
        await redisSetWithTimestamp(cacheKey, result.data);
    }

    res.status(200).send(result.data);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch(e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}