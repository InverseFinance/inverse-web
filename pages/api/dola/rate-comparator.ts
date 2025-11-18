import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getAaveV3Rate, getAaveV3RateDAI, getCompoundRate, getCrvUSDRate, getFirmRate, getFluidRates, getFraxRate, getSparkRate } from '@app/util/borrow-rates-comp';
import { timestampToUTC } from '@app/util/misc';
import { TOKEN_IMAGES } from '@app/variables/images';
import { projectCollaterals } from '@app/components/F2/RateComparator';

export default async function handler(req, res) {
  const cacheKey = `borrow-rates-compare-v1.1.7`;

  try {
    const cacheDuration = 900;
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

    const _rates = (await Promise.all([
      getAaveV3Rate(provider),
      // getAaveV3RateDAI(provider),
      getCompoundRate(provider),
      // WBTC market
      getCrvUSDRate('0xE0438Eb3703bF871E31Ce639bd351109c88666ea', 'WBTC', provider),
      // wstETH
      getCrvUSDRate('0x37417B2238AA52D0DD2D6252d989E728e8f706e4', 'wstETH', provider),
      getCrvUSDRate('0x1681195c176239ac5e72d9aebacf5b2492e0c4ee', 'WETH', provider),
      getFraxRate(provider, '0x3835a58CA93Cdb5f912519ad366826aC9a752510', 'CRV'),
      getFraxRate(provider, '0x794F6B13FBd7EB7ef10d1ED205c9a416910207Ff', 'WETH'),
      getFraxRate(provider, '0x32467a5fc2d72D21E8DCe990906547A2b012f382', 'WBTC'),
      getFraxRate(provider, '0x78bB3aEC3d855431bd9289fD98dA13F9ebB7ef15', 'sfrxETH'),
      getFraxRate(provider, '0xb5a46f712F03808aE5c4B885C6F598fA06442684', 'wstETH'),
      getFraxRate(provider, '0xa1D100a5bf6BFd2736837c97248853D989a9ED84', 'CVX'),
      getFraxRate(provider, '0xb5Ae5b75C0DF5632c572A657109375646Ce66f90', 'sUSDe'),
      getSparkRate(),
      getFirmRate(provider),
      getFluidRates(),
    ])).flat();

    _rates.sort((a, b) => {
      return a.type === 'fixed' || a.borrowRate < b.borrowRate ? -1 : a.borrowRate - b.borrowRate;
    });

    const now = Date.now();
    const nowDayUTC = timestampToUTC(now);
    let utcSnapshots = cachedData?.utcSnapshots || [];
    let pastRates = cachedData?.pastRates || [];

    const addTodayRate = !utcSnapshots.includes(nowDayUTC)
    if(addTodayRate) {
      utcSnapshots.push(nowDayUTC);
      pastRates.push({});
    }

    const rates = _rates.map(rate => {
      const key = `${rate.project}-${rate.collateral || 'multiple'}-${rate.borrowToken || 'USDC'}`;
      const pastRatesLen = pastRates.length;
      if(addTodayRate) {
        pastRates[pastRatesLen - 1][key] = rate.borrowRate;
      }
      const last7 = pastRates.slice(pastRatesLen - 7, pastRatesLen).filter(pr => !!pr[key]);
      const last30 = pastRates.slice(pastRatesLen - 30, pastRatesLen).filter(pr => !!pr[key]);
      const last60 = pastRates.slice(pastRatesLen - 60, pastRatesLen).filter(pr => !!pr[key]);
      const last90 = pastRates.slice(pastRatesLen - 90, pastRatesLen).filter(pr => !!pr[key]);
      const _borrowToken = rate.borrowToken || (rate.project === 'FiRM' ? 'DOLA' : 'USDC');
      return {
        ...rate,
        avg7: last7.length >= 7 ? last7.reduce((prev, curr) => prev+(curr[key]||0), 0)/last7.length : 0,
        avg30: last30.length >= 30 ? last30.reduce((prev, curr) => prev+(curr[key]||0), 0)/last30.length : 0,
        avg60: last60.length >= 60 ? last60.reduce((prev, curr) => prev+(curr[key]||0), 0)/last60.length : 0,
        avg90: last90.length >= 90 ? last90.reduce((prev, curr) => prev+(curr[key]||0), 0)/last90.length : 0,
        image: TOKEN_IMAGES[_borrowToken],
        key,
      };
    });

    if(utcSnapshots.length > 90) {
      utcSnapshots = utcSnapshots.slice(0, 90);
      pastRates = pastRates.slice(0, 90);
    }

    const result = {
      timestamp: now,
      projectCollaterals,
      utcSnapshots,
      pastRates,
      rates,
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
