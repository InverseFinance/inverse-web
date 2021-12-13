import { Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { ERC20_ABI } from '@inverse/config/abis'
import { getNetworkConfig } from '@inverse/config/networks'
import { getProvider } from '@inverse/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@inverse/util/redis'
import { NetworkIds } from '@inverse/types';

export default async function handler(req, res) {
  // const { chainId = '1' } = req.query;
  // defaults to mainnet data if unsupported network
  const networkConfig = getNetworkConfig(NetworkIds.mainnet, true)!;
  const cacheKey = `${networkConfig.chainId}-dola-cache`;

  try {
    const { DOLA } = networkConfig;

    const validCache = await getCacheFromRedis(cacheKey, true, 600);
    if(validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const contract = new Contract(DOLA, ERC20_ABI, provider);

    const totalSupply = await contract.totalSupply()

    const resultData = {
      totalSupply: parseFloat(formatEther(totalSupply)),
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
