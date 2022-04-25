import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { fetchJson } from 'ethers/lib/utils';

export default async function handler(req, res) {
  const cacheKey = `yearn-fed-v1.0.0`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 30);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const yearnFedData = await fetchJson('http://34.205.72.180:4444/api');

    await redisSetWithTimestamp(cacheKey, yearnFedData);

    res.status(200).json(yearnFedData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch(e) {
      console.error(e);
    }
  }
}