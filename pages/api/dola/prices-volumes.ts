import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getHistoricalTokenData } from '@app/util/markets';
import { ONE_DAY_MS } from '@app/config/constants';

export default async function handler(req, res) {
  const { cacheFirst } = req.query;
  const cacheKey = `dola-histo-prices-v1.0.0`;
  const cacheDuration = 3600;

  try {
    const { isValid, data: archivedPrices } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (isValid) {
      return res.status(200).send(archivedPrices);
    }
    const archive = archivedPrices || { prices: [], volumes: [] };
    const now = Date.now();
    const lastKnownPriceTsSec = archive?.prices?.length ? archive.prices[archive.prices.length - 1][0] : -Infinity;
    const lastYearPrices = await getHistoricalTokenData('dola-usd', Math.floor((now - (ONE_DAY_MS * 364)) / 1000));
    const newPrices = lastYearPrices.prices.filter(priceData => priceData[0] > lastKnownPriceTsSec);
    const newVolumes = lastYearPrices.total_volumes.filter(volData => volData[0] > lastKnownPriceTsSec);

    const result = {
      timestamp: Date.now(),
      prices: archive.prices.concat(newPrices),
      volumes: archive.volumes.concat(newVolumes),
    };

    await redisSetWithTimestamp(cacheKey, result);

    res.status(200).send(result);

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
    }
  }
}