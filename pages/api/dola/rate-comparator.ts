import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getAaveV3Rate, getAaveV3RateDAI, getCompoundRate, getCrvUSDRate, getFirmRate, getFraxRate, getSparkRate } from '@app/util/borrow-rates-comp';

export default async function handler(req, res) {
  const cacheKey = `borrow-rates-compare-v1.1.3`;

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
      getAaveV3Rate(provider),
      getAaveV3RateDAI(provider),
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
      getSparkRate(),
      getFirmRate(provider),
    ]);

    rates.sort((a, b) => {
      return a.type === 'fixed' || a.borrowRate < b.borrowRate ? -1 : a.borrowRate - b.borrowRate;
    });

    const result = {
      timestamp: Date.now(),
      rates: rates.map(rate => ({ ...rate, key: `${rate.project}-${rate.collateral||'multiple'}-${rate.borrowToken||'USDC'}` })),
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
