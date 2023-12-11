import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types'
import { getBnToNumber } from '@app/util/markets'

const { DBR, TREASURY } = getNetworkConfigConstants();

const excluded = [
  TREASURY,
];

export default async function handler(req, res) {  
  const cacheKey = `dbr-circ-supply-v1.0.0`;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);
    const contract = new Contract(DBR, DBR_ABI, provider);

    const [totalSupply, ...excludedBalances] = await Promise.all([
      contract.totalSupply(),
      ...excluded.map(excludedAd => contract.balanceOf(excludedAd)),
    ]);

    const totalDbrExcluded = excludedBalances.map(bn => getBnToNumber(bn))
      .reduce((prev, curr) => prev + curr, 0);

    const circulatingSupply = getBnToNumber(totalSupply) - totalDbrExcluded;    

    await redisSetWithTimestamp(cacheKey, circulatingSupply);

    res.status(200).send(circulatingSupply);
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