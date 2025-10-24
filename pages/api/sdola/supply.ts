import { Contract } from 'ethers'
import 'source-map-support'
import { SDOLA_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { SDOLA_ADDRESS } from '@app/config/constants';

export default async function handler(req, res) {
  const cacheKey = `sdola-supply-v1.0.1`;

  try {
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    // const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    // if(validCache) {
    //   res.status(200).send(validCache);
    //   return
    // }

    const provider = getProvider(1);
    const contract = new Contract(SDOLA_ADDRESS, SDOLA_ABI, provider);

    const result = await contract.totalSupply()

    const totalSupply = getBnToNumber(result);

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