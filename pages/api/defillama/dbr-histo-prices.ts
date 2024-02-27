import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj } from '@app/util/redis'
import { DBR_EXTRA_CACHE_KEY } from '../dbr';
import { ONE_DAY_SECS } from '@app/config/constants';

export default async function handler(req, res) {
  try {
    const cacheDuration = ONE_DAY_SECS/2;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData } = await getCacheFromRedisAsObj(DBR_EXTRA_CACHE_KEY, false);
    
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

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(DBR_EXTRA_CACHE_KEY, false);
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