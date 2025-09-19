import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { isAddress } from 'ethers/lib/utils';

import { BURN_ADDRESS } from '@app/config/constants';
import { getTokenHolders } from '@app/util/covalent';

const LENSES = {
  1: "0x5336183353cA175Cc1ED3E067c8F057683bf21a9",
  11155111: "0x542f65d73263F129D6313D7e6060885465b6e91b",
}

export const monolithSupportedChainIds = Object.keys(LENSES);

export default async function handler(req, res) {
  const cacheDuration = 60;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);
  
  const { chainId, vault, cacheFirst } = req.query;
  if(!monolithSupportedChainIds.includes(chainId) || !vault || vault === BURN_ADDRESS || (!!vault && !isAddress(vault))) {
    return res.status(400).json({ success: false, error: 'Invalid address' });
  }
  const cacheKey = `monolith-stakers-${vault}-${chainId}-v1.0.0`;  
  try {

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    let holdersData;
    try {
      holdersData = await getTokenHolders(vault, 1000, 0, chainId);
    } catch (e) {
      console.error(e);
      // return res.status(500).json({ success: false, error: 'Error fetching holders' });
    }

    const resultData = {
      errorOrNotSupported: !holdersData,
      timestamp: +(new Date(holdersData?.data?.updated_at)),
      positions: holdersData?.data?.items.map(item => {
        return {
          account: item.address,
          balance: parseFloat(item.balance) / 1e18,
        }
      }) || [],
    }

    await redisSetWithTimestamp(cacheKey, resultData, false);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false, 0, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      } else {
        res.status(500).json({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}