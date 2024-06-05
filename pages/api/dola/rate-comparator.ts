import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getAaveV3Rate, getAaveV3RateDAI, getCompoundRate, getCrvUSDRate, getFirmRate, getSiloRate } from '@app/util/borrow-rates-comp';

export default async function handler(req, res) {
  const cacheKey = `borrow-rates-compare-v1.0.3`;

  try {
    const cacheDuration = 600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const rates = await Promise.all([
      getSiloRate(),
      getAaveV3Rate(),
      getAaveV3RateDAI(),
      getCompoundRate(),
      // WBTC market
      getCrvUSDRate('0xE0438Eb3703bF871E31Ce639bd351109c88666ea', 'WBTC', provider),
      // wstETH
      getCrvUSDRate('0x37417B2238AA52D0DD2D6252d989E728e8f706e4', 'wstETH', provider),
      getFirmRate(provider),
    ]);

    rates.sort((a, b) => {
      return a.type === 'fixed' || a.borrowRate < b.borrowRate ? -1 : a.borrowRate - b.borrowRate;
    });

    const result = {
      timestamp: Date.now(),
      rates: rates.map(rate => ({ ...rate, key: `${rate.project}-${rate.collateral}-${rate.borrowToken}` })),
    };

    await redisSetWithTimestamp(cacheKey, result);

    return res.status(200).json(result);

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
      return res.status(500);
    }
  }
}
