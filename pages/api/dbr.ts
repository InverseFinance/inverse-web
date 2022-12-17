import { Contract } from 'ethers'
import 'source-map-support'
import { BALANCER_VAULT_ABI, DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';

const { DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `dbr-cache-v1.0.0`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 1800);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const contract = new Contract(DBR, DBR_ABI, provider);
    const balancerVault = new Contract('0xBA12222222228d8Ba445958a75a0704d566BF2C8', BALANCER_VAULT_ABI, provider);

    const [totalSupply, poolData] = await Promise.all([
      contract.totalSupply(),
      balancerVault.getPoolTokens('0x445494f823f3483ee62d854ebc9f58d5b9972a25000200000000000000000415'),
    ]);

    const price = poolData && poolData[1] ? getBnToNumber(poolData[1][0])/getBnToNumber(poolData[1][1]) : 0.04;

    const resultData = {
      price,
      totalSupply: getBnToNumber(totalSupply),
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch(e) {
      console.error(e);
    }
  }
}