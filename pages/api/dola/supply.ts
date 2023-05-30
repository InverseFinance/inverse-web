import { Contract } from 'ethers'
import 'source-map-support'
import { INV_ABI } from '@app/config/abis'
import { getNetworkConfig } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'

export default async function handler(req, res) {
  const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
  const cacheKey = `${networkConfig.chainId}-dola-supply-v1.0.0`;

  try {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const contract = new Contract(process.env.NEXT_PUBLIC_DOLA!, INV_ABI, provider);

    const result = await contract.totalSupply()

    const totalSupply = getBnToNumber(result);

    await redisSetWithTimestamp(cacheKey, totalSupply);

    res.status(200).send(totalSupply);
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
    }
  }
}