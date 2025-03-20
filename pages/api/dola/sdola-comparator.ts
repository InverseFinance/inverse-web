import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getAaveV3RateOf } from '@app/util/borrow-rates-comp';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber, getDefiLlamaApy, getSavingsCrvUsdData, getSavingsUSDData, getSUSDEData } from '@app/util/markets';
import { getDSRData } from '@app/util/markets';
import { TOKEN_IMAGES } from '@app/variables/images';
import { timestampToUTC } from '@app/util/misc';
import { Contract } from 'ethers';
import { SDOLA_ABI } from '@app/config/abis';
import { getMulticallOutput } from '@app/util/multicall';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';

export const getHistoricalRates = async (addresses: string[]) => {
  const { data: utcKeyBlockValues, isValid } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS, isValid: false };
  const provider = getProvider(NetworkIds.mainnet);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const thirtyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 30 * dayMs)];
  const sixtyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 60 * dayMs)];
  const ninetyDaysAgoBlock = utcKeyBlockValues[NetworkIds.mainnet][timestampToUTC(now - 90 * dayMs)];
  const blocks = [undefined, thirtyDaysAgoBlock, sixtyDaysAgoBlock, ninetyDaysAgoBlock];

  const [todayRates, thirtyDayRates, sixtyDayRates, ninetyDayRates] = await Promise.all(
    blocks.map(block => getMulticallOutput(
      addresses.map(address => ({
        contract: new Contract(address, SDOLA_ABI, provider),
        functionName: 'convertToAssets',
        params: ['1000000000000000000'],
      })),
      1,
      block,
    ))
  );

  return addresses.map((address, index) => {
    const todayExRate = getBnToNumber(todayRates[index]);
    const apy30d = (todayExRate / getBnToNumber(thirtyDayRates[index]) - 1) * 365 / 30 * 100;
    const apy60d = (todayExRate / getBnToNumber(sixtyDayRates[index]) - 1) * 365 / 60 * 100;
    const apy90d = (todayExRate / getBnToNumber(ninetyDayRates[index]) - 1) * 365 / 90 * 100;
    return {
      apy30d,
      apy60d,
      apy90d,
    }
  });
}

export default async function handler(req, res) {
  const cacheKey = `sdola-rates-compare-v1.0.6`;

  try {
    const cacheDuration = 120;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
    res.setHeader('Access-Control-Allow-Origin', `*`);
    res.setHeader('Access-Control-Allow-Methods', `GET`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration);

    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const symbols = [
      'USDC', 'USDT',
      'sDAI', 'sfrxUSD', 'sUSDe', 'sDOLA', 'scrvUSD', 'sUSDS'
      // , 'sUSDz'
    ];
    const addresses = [
      '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
      '0xcf62F905562626CfcDD2261162a51fd02Fc9c5b6',
      '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
      '0xb45ad160634c528Cc3D2926d9807104FA3157305',
      '0x0655977FEb2f289A4aB78af67BAB0d17aAb84367',
      '0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD',
    ]
    const projects = [
      'Aave-V3', 'Aave-V3', 
      'Spark', 'Frax', 'Ethena', 'FiRM', 'Curve', 'Sky'
      // , 'Anzen'
    ];
    const links = [
      'https://app.aave.com/reserve-overview/?underlyingAsset=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&marketName=proto_mainnet_v3',
      'https://app.aave.com/reserve-overview/?underlyingAsset=0xdac17f958d2ee523a2206206994597c13d831ec7&marketName=proto_mainnet_v3',
      'https://app.spark.fi/',
      // 'https://app.frax.finance/sfrax/stake',
      'https://frax.com/earn',
      'https://app.ethena.fi/earn',
      'https://inverse.finance/sDOLA',
      'https://crvusd.curve.fi/#/ethereum/scrvUSD',
      'https://sky.money',
      'https://app.anzen.finance/stake',
    ];

    const rates = await Promise.all([
      getAaveV3RateOf(provider, 'USDC'),
      getAaveV3RateOf(provider, 'USDT'),
      getDSRData(),
      // getSFraxData(provider),
      getDefiLlamaApy("42523cca-14b0-44f6-95fb-4781069520a5"),
      getSUSDEData(provider, true),
      fetch('https://www.inverse.finance/api/dola-staking').then(res => res.json()),
      getSavingsCrvUsdData(),
      getSavingsUSDData(),
      // getSavingsUSDzData(),
    ]);

    const vaultHistoricalRates = await getHistoricalRates(addresses);
    const aaveHistoricalRates = await Promise.all([
      getDefiLlamaApy('aa70268e-4b52-42bf-a116-608b370f9501'),
      getDefiLlamaApy('f981a304-bb6c-45b8-b0c5-fd2f515ad23a'),
    ]);
    const historicalRates = aaveHistoricalRates.concat(vaultHistoricalRates);

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
        const last30 = pastRates.slice(pastRatesLen - 30, pastRatesLen).filter(pr => !!pr[symbol]);
        const last60 = pastRates.slice(pastRatesLen - 60, pastRatesLen).filter(pr => !!pr[symbol]);
        const last90 = pastRates.slice(pastRatesLen - 90, pastRatesLen).filter(pr => !!pr[symbol]);
        return {
          isVault: projects[index] !== 'Aave-V3',
          apy: (rate.supplyRate || rate.apy),
          apy30d: (rate.apyMean30d || rate.apy30d),
          avg30: historicalRates[index].apy30d || (last30.length >= 30 ? last30.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last30.length : 0),
          avg60: historicalRates[index].apy60d || (last60.length >= 60 ? last60.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last60.length : 0),
          avg90: historicalRates[index].apy90d || (last90.length >= 90 ? last90.reduce((prev, curr) => prev + (curr[symbol] || 0), 0) / last90.length : 0),
          symbol,
          image: TOKEN_IMAGES[symbol],
          project: projects[index],
          link: links[index],
        }
      }).sort((a, b) => {
        return a.apy < b.apy ? 1 : b.apy - a.apy;
      });

    if (utcSnapshots.length > 90) {
      utcSnapshots = utcSnapshots.slice(0, 90);
      pastRates = pastRates.slice(0, 90);
    }

    const result = {
      timestamp: Date.now(),
      historicalRates,
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
