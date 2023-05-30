import { Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI, FIRM_FED_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';

const { DOLA, FEDS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `dola-cache-v1.0.0`;
  const cacheDuration = 600;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  try {
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const contract = new Contract(DOLA, DOLA_ABI, provider);
    const firmFed = FEDS.find((f) => f.isFirm)!;
    const firmFedContract = new Contract(firmFed.address, FIRM_FED_ABI, provider);

    const [totalSupply, firmSupply] = await Promise.all([
      contract.totalSupply(),
      firmFedContract.globalSupply(),
    ]);    

    const resultData = {
      totalSupply: getBnToNumber(totalSupply),
      firmSupply: getBnToNumber(firmSupply),
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