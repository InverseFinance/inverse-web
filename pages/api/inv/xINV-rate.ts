import { Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { XINV_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getNetworkConfigConstants } from '@app/util/networks';

const { XINV } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `xINV-rate-v1.0.0`;

  try {
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const xInvContract = new Contract(XINV, XINV_ABI, provider);

    const result = await xInvContract.exchangeRateStored();

    const value = formatEther(result);

    await redisSetWithTimestamp(cacheKey, value);

    res.status(200).send(value);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch(e) {
      console.error(e);
      return res.status(500);
    }
  }
}