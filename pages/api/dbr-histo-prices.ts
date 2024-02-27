import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { ONE_DAY_SECS } from '@app/config/constants';
import { fillMissingDailyDatesWithMostRecentData, getTimestampFromUTCDate, timestampToUTC } from '@app/util/misc';
import { DBR_EXTRA_CACHE_KEY } from './dbr';

export default async function handler(req, res) {
  const cacheKey = 'dbr-histo-prices-utc';
  try {
    const cacheDuration = ONE_DAY_SECS/2;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);    
    const dbrUtcPricesCacheData = await getCacheFromRedis(cacheKey, true, 3600);
    
    if(dbrUtcPricesCacheData) {
      return res.status(200).json(dbrUtcPricesCacheData);
    }
    const cachedData = await getCacheFromRedis(DBR_EXTRA_CACHE_KEY, false);    

    const now = Date.now();
    const todayUtc = timestampToUTC(Date.now());

    const dbrPricesByUtcDates = cachedData.historicalData.prices.map(([ts, price]) => {
      return {
        utcDate: timestampToUTC(ts),
        price,
      };
    });

    dbrPricesByUtcDates.sort((a, b) => b.utcDate < a.utcDate ? 1 : -1);

    if (!dbrPricesByUtcDates.find(d => d.utcDate === todayUtc)) {
      dbrPricesByUtcDates.push(({
        utcDate: todayUtc,
        price: cachedData.priceUsd,
      }));
    }

    const withFilledMissingData = fillMissingDailyDatesWithMostRecentData(dbrPricesByUtcDates, 1)
      .map(d => {
        return {
          timestamp: getTimestampFromUTCDate(d.utcDate),
          utcDate: d.utcDate,
          price: d.price,
        }
      });

    const resultData = {
      timestamp: now,
      dbrPricesByUtcDates: withFilledMissingData,
    }

    redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
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