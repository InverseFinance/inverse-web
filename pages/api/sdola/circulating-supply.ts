import { Contract } from 'ethers'
import 'source-map-support'
import { SDOLA_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { SDOLA_ADDRESS } from '@app/config/constants';
import { getNetworkConfigConstants } from '@app/util/networks';

const { TREASURY } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `sdola-circ-supply-v1.0.0`;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(1);
    const contract = new Contract(SDOLA_ADDRESS, SDOLA_ABI, provider);

    const [totalSupplyBn, treasuryBalanceBn] = await Promise.all([
        contract.totalSupply(),
        contract.balanceOf(TREASURY),
    ])

    const totalSupply = getBnToNumber(totalSupplyBn);
    const treasuryBalance = getBnToNumber(treasuryBalanceBn);
    
    const circSupply = totalSupply - treasuryBalance;

    await redisSetWithTimestamp(cacheKey, circSupply);

    res.status(200).send(circSupply);
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