import { Contract } from 'ethers'
import 'source-map-support'
import { BALANCER_VAULT_ABI, DBR_ABI, DBR_DISTRIBUTOR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { getDbrPriceOnCurve } from '@app/util/f2';

const { DBR, DBR_DISTRIBUTOR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const withExtra = req.query.withExtra === 'true';
  const cacheKey = `dbr-cache${withExtra ? '-extra' : ''}-v1.0.4`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 300);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const dbr = new Contract(DBR, DBR_ABI, provider);
    const dbrDistributor = new Contract(DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI, provider);
    const balancerVault = new Contract('0xBA12222222228d8Ba445958a75a0704d566BF2C8', BALANCER_VAULT_ABI, provider);

    const queries = [
      balancerVault.getPoolTokens('0x445494f823f3483ee62d854ebc9f58d5b9972a25000200000000000000000415'),
      getDbrPriceOnCurve(provider),
    ].concat(withExtra ? [
      dbr.totalSupply(),      
      dbr.totalDueTokensAccrued(),
      dbr.operator(),
      dbrDistributor.rewardRate(),
    ] : []);

    const results = await Promise.all(queries);

    const [poolData, curvePriceData] = results;
    const priceOnBalancer = poolData && poolData[1] ? getBnToNumber(poolData[1][0]) / getBnToNumber(poolData[1][1]) : 0.05;

    const { priceInDola: priceOnCurve } = curvePriceData;

    const resultData = {
      timestamp: +(new Date()),
      priceOnBalancer,
      price: priceOnCurve,
      totalSupply: withExtra ? getBnToNumber(results[2]) : undefined,      
      totalDueTokensAccrued: withExtra ? getBnToNumber(results[3]) : undefined,
      operator: withExtra ? results[4] : undefined,
      rewardRate: withExtra ? getBnToNumber(results[5]) : undefined,
    }

    await redisSetWithTimestamp(cacheKey, resultData);

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
        res.status(500).json({ status: 'ko' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ status: 'ko' });
    }
  }
}