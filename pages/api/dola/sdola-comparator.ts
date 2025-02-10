import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getSavingsCrvUsdData, getSavingsUSDData, getSavingsUSDzData, getSFraxData, getSUSDEData } from '@app/util/markets';
import { getDSRData } from '@app/util/markets';
import { TOKEN_IMAGES } from '@app/variables/images';
import { timestampToUTC } from '@app/util/misc';

export default async function handler(req, res) {
  const cacheKey = `sdola-rates-compare-v1.0.4`;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration);

    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const symbols = [
      // 'USDC', 'USDT',
      'sDAI', 'sFRAX', 'sUSDe', 'sDOLA', 'scrvUSD', 'sUSDS', 'sUSDz'];
    const projects = [
      // 'Aave-V3', 'Aave-V3', 
      'Spark', 'Frax', 'Ethena', 'FiRM', 'Curve', 'Sky', 'Anzen'];
    const links = [
      // 'https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3',
      // 'https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3',
      'https://app.spark.fi/',
      'https://app.frax.finance/sfrax/stake',
      'https://app.ethena.fi/earn',
      'https://inverse.finance/sDOLA',
      'https://crvusd.curve.fi/#/ethereum/scrvUSD',
      'https://sky.money',
      'https://app.anzen.finance/stake',
    ];

    const rates = await Promise.all([
      // getAaveV3RateOf(provider, 'USDC'),
      // getAaveV3RateOf(provider, 'USDT'),
      getDSRData(),
      getSFraxData(provider),
      getSUSDEData(provider, true),
      fetch('https://www.inverse.finance/api/dola-staking').then(res => res.json()),
      getSavingsCrvUsdData(),
      getSavingsUSDData(),
      // getSavingsUSDzData(),
    ]);

    const now = Date.now();
    const nowDayUTC = timestampToUTC(now);
    let utcSnapshots = cachedData?.utcSnapshots || [];
    let pastRates = cachedData?.pastRates || [];

    const addTodayRate = !utcSnapshots.includes(nowDayUTC);
    if (addTodayRate) {
      utcSnapshots.push(nowDayUTC);
      pastRates.push({});
    }

    const sortedRates = rates
      .map((rate, index) => {
        const symbol = symbols[index];
        const pastRatesLen = pastRates.length;
        if (addTodayRate) {
          pastRates[pastRatesLen - 1][symbol] = rate.apy;
        }
        const last7 = pastRates.slice(pastRatesLen - 7, pastRatesLen).filter(pr => !!pr[symbol]);
        const last30 = pastRates.slice(pastRatesLen - 30, pastRatesLen).filter(pr => !!pr[symbol]);
        return {
          apy: (rate.supplyRate || rate.apy),
          apy30d: (rate.apyMean30d || rate.apy30d),
          avg7: last7.length ? last7.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last7.length : rate.apy,
          avg30: last30.length ? last30.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last30.length : rate.apy,
          symbol,
          image: TOKEN_IMAGES[symbol],
          project: projects[index],
          link: links[index],
        }
      }).sort((a, b) => {
        return a.apy < b.apy ? 1 : b.apy - a.apy;
      });

    const result = {
      timestamp: Date.now(),
      pastRates,
      utcSnapshots,
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
