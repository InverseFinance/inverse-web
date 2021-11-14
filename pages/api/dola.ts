import { Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { ERC20_ABI } from '@inverse/config/abis'
import { getNetworkConfig } from '@inverse/config/networks'
import { getProvider } from '@inverse/util/providers';
import { createNodeRedisClient } from 'handy-redis';

const client = createNodeRedisClient({
  url: process.env.REDIS_URL
});

export default async function handler(req, res) {
  try {
    const { chainId = '1' } = req.query;
    // defaults to mainnet data if unsupported network
    const networkConfig = getNetworkConfig(chainId, true)!;
    const { DOLA } = networkConfig;

    const cacheKey = `${networkConfig.chainId}-dola-cache`;

    const cache = await client.get(cacheKey);

    if(cache) {
      const now = Date.now();
      const cacheObj = JSON.parse(cache);
      // 30 min cache
      if((now - cacheObj?.timestamp) / 1000 < 1800) {
        res.status(200).json(cacheObj.data);
        return
      }
    }

    const provider = getProvider(networkConfig.chainId);
    const contract = new Contract(DOLA, ERC20_ABI, provider);

    const totalSupply = await contract.totalSupply()

    const resultData = {
      totalSupply: parseFloat(formatEther(totalSupply)),
    }

    await client.set(cacheKey, JSON.stringify({ timestamp: Date.now(), data: resultData }));

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err)
  }
}
