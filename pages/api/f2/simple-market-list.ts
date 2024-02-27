import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'

export const F2_MARKETS_CACHE_KEY = `f2markets-v1.1.99`;

export default async function handler(req, res) {
  try {
    const cacheDuration = 7200;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData } = await getCacheFromRedisAsObj(F2_MARKETS_CACHE_KEY, false);
    
    const simplifiedMarkets = cachedData.markets.map(m => {
      return {
        name: m.name,
        collateral: m.collateral,
        address: m.address,
        startingBlock: m.startingBlock,
      }
    })

    const resultData = {
      timestamp: cachedData.timestamp,
      markets: simplifiedMarkets,      
    }

    await redisSetWithTimestamp(F2_MARKETS_CACHE_KEY, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(F2_MARKETS_CACHE_KEY, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      } else {
        res.status(500).json({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}