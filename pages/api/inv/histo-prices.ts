import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getHistoricalTokenData } from '@app/util/markets';
import { INV_HISTO_PRICES } from '@app/fixtures/fixture-inv-prices';
import { ONE_DAY_MS } from '@app/config/constants';

export default async function handler(req, res) {
  const { cacheFirst } = req.query;
  const cacheKey = `inv-histo-prices-v1.0.1`;
  const cacheDuration = 3600;

  try {
    const { isValid, data: archivedPrices } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (isValid) {
      return res.status(200).send(archivedPrices);
    }
    const archive = archivedPrices || { prices: INV_HISTO_PRICES };
    const now = Date.now();
    const lastKnownPriceTsSec = Math.floor(archive.prices[archive.prices.length - 1][0] / 1000);
    const lastYearPrices = await getHistoricalTokenData('inverse-finance', Math.floor((now - (ONE_DAY_MS * 364)) / 1000));
    const newPrices = lastYearPrices.prices.filter(priceData => priceData[0] > lastKnownPriceTsSec * 1000);

    const result = {
      timestamp: Date.now(),
      prices: archive.prices.concat(newPrices),
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