import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj } from '@app/util/redis'

export const DBR_CIRC_SUPPLY_EVO_CACHE_KEY = `dbr-circ-supply-evolution-v1.0.0`;

export default async function handler(req, res) {
  try {
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    // cache is now updated via daily cron job
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DBR_CIRC_SUPPLY_EVO_CACHE_KEY, false, cacheDuration);
    res.status(200).send(cachedData);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(DBR_CIRC_SUPPLY_EVO_CACHE_KEY, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch (e) {
      console.error(e);
      res.status(500);
    }
  }
}