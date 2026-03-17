import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'

import { JDOLA_AUCTION_ADDRESS } from '@app/config/constants';
import { getTokenHolders } from '@app/util/covalent';

export default async function handler(req, res) {
  const cacheDuration = 120;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);
  
  const { cacheFirst } = req.query;

  const cacheKey = `jrdola-stakers-v1.0.0`;  
  try {

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    let holdersData;
    try {
      holdersData = await getTokenHolders(JDOLA_AUCTION_ADDRESS, 1000, 0, '1');
    } catch (e) {
      console.error(e);
      // return res.status(500).json({ success: false, error: 'Error fetching holders' });
    }

    const resultData = {
      errorOrNotSupported: !holdersData,
      timestamp: +(new Date(holdersData?.data?.updated_at)),
      positions: holdersData?.data?.items.map(item => {
        return {
          account: item.address,
          balance: parseFloat(item.balance) / 1e18,
        }
      }) || [],
    }

    await redisSetWithTimestamp(cacheKey, resultData, false);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false, 0, false);
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