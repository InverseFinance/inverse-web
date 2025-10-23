import { Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types'

const { DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `dbr-supply-v1.0.0`;

  try {
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    // const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    // if(validCache) {
    //   res.status(200).send(validCache);
    //   return
    // }

    const provider = getProvider(NetworkIds.mainnet);
    const contract = new Contract(DBR, DBR_ABI, provider);

    const result = await contract.totalSupply()

    const totalSupply = formatEther(result);

    // await redisSetWithTimestamp(cacheKey, totalSupply);

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