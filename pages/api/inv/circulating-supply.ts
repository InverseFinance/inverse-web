import { Contract } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import 'source-map-support'
import { INV_ABI } from '@app/config/abis'
import { getNetworkConfig } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';

const {
  TREASURY,
  OP_BOND_MANAGER,
} = getNetworkConfigConstants();

const excluded = [
  TREASURY,
  OP_BOND_MANAGER,
  // Nour vested Token
  '0xbB6ef0B93792E4E98C6E6062EB1a9638D82E500f',
  // Stacking ETH INV LP
  '0x5c1245F9dB3f8f7Fe1208cB82325eA88fC11Fe89',
]

export default async function handler(req, res) {
  const networkConfig = getNetworkConfig(process.env.NEXT_PUBLIC_CHAIN_ID!, true)!;
  const cacheKey = `${networkConfig.chainId}-inv-circ-supply-v1.0.0`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 30);

    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(networkConfig.chainId);
    const contract = new Contract(process.env.NEXT_PUBLIC_REWARD_TOKEN!, INV_ABI, provider);

    const [totalSupply, ...excludedBalances] = await Promise.all([
      contract.totalSupply(),
      ...excluded.map(excludedAd => contract.balanceOf(excludedAd))
    ]);

    const circulatingSupply = formatEther(
      excludedBalances
        .reduce((prev, curr) => {
          return prev.sub(curr)
        }, totalSupply)
    );

    await redisSetWithTimestamp(cacheKey, circulatingSupply);

    res.status(200).send(circulatingSupply);
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
      res.status(500);
    }
  }
}