import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
// import { getAaveV3RateOf } from '@app/util/borrow-rates-comp';
import { getSFraxData, getSUSDEData } from '@app/util/markets';
import { getDSRData } from '@app/util/markets';
import { TOKEN_IMAGES } from '@app/variables/images';

export default async function handler(req, res) {
  const cacheKey = `sdola-rates-compare-v1.0.0`;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const symbols = [
      // 'USDC', 'USDT',
      'sDAI', 'sFRAX', 'sUSDe', 'sDOLA'];
    const projects = [
      // 'Aave-V3', 'Aave-V3', 
      'Spark', 'Frax', 'Ethena', 'FiRM'];
    const links = [
      // 'https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3',
      // 'https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3',
      'https://app.spark.fi/',
      'https://app.frax.finance/sfrax/stake',
      'https://app.ethena.fi/earn',
      'https://inverse.finance/sDOLA',
    ];

    const rates = await Promise.all([
      // getAaveV3RateOf(provider, 'USDC'),
      // getAaveV3RateOf(provider, 'USDT'),
      getDSRData(),
      getSFraxData(provider),
      getSUSDEData(provider),
      fetch('https://www.inverse.finance/api/dola-staking').then(res => res.json()),
    ]);

    const sortedRates = rates
      .map((rate, index) => {
        return {
          apy: (rate.supplyRate || rate.apy),
          symbol: symbols[index],
          image: TOKEN_IMAGES[symbols[index]],
          project: projects[index],
          link: links[index],
        }
      }).sort((a, b) => {
        return a.apy < b.apy ? 1 : b.apy - a.apy;
      });

    const result = {
      timestamp: Date.now(),
      rates: sortedRates,
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
