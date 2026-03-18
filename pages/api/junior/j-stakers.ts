import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'

import { JDOLA_AUCTION_ADDRESS } from '@app/config/constants';
import { getTokenHolders } from '@app/util/covalent';
import { jdolaStakingCacheKey } from './jdola-staking';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { getProvider } from '@app/util/providers';
import { getJuniorEscrowContract } from '@app/util/junior';
import { getBnToNumber } from '@app/util/markets';

export default async function handler(req, res) {
  const cacheDuration = 120;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

  const { cacheFirst } = req.query;

  const cacheKey = `jrdola-stakers-v1.0.0`;
  try {

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
    // if (isValid) {
    //   res.status(200).json(cachedData);
    //   return
    // }

    let holdersData, juniorData;
    try {
      const results = await Promise.all([
        getTokenHolders(JDOLA_AUCTION_ADDRESS, 1000, 0, '1'),
        getCacheFromRedisAsObj(jdolaStakingCacheKey, false)
      ])
      holdersData = results[0];
      juniorData = results[1]?.data;
    } catch (e) {
      console.error(e);
      // return res.status(500).json({ success: false, error: 'Error fetching holders' });
    }

    const dolaExRate = juniorData.sDolaExRate * juniorData.jrDolaExRate;

    const positions = holdersData?.data?.items.map(item => {
      const balance = parseFloat(item.balance) / 1e18;
      return {
        account: item.address,
        balance,
        balanceInDola: balance * dolaExRate,
        supplySharePerc: balance / juniorData.jrDolaSupply * 100,
      }
    }) || [];

    const provider = getProvider(1);
    const escrowContract = getJuniorEscrowContract(provider)

    const [
      withdrawAmounts,
      exitWindows,
    ] = await getGroupedMulticallOutputs([
      positions.map((p) => ({ contract: escrowContract, functionName: 'withdrawAmounts', params: [p.account] })),
      positions.map((p) => ({ contract: escrowContract, functionName: 'exitWindows', params: [p.account] })),
    ], 1, undefined, provider, true);

    const now = Date.now();

    const resultData = {
      errorOrNotSupported: !holdersData,
      timestamp: now,
      positions: positions.map((p,i) => {
        const [start, end] = exitWindows[i];
        const startMs = start * 1000;
        const endMs = end * 1000;
        const isBefore = now < startMs;
        const isExpired = now > endMs;
        const isWithin = now <= endMs && now >= startMs;
        return {
          isBefore,
          isExpired,
          isWithin,
          withdrawStatus: isBefore ? 'queued' : isExpired ? 'expired' : 'active',
          withdrawAmount: getBnToNumber(withdrawAmounts[i]),
          withdrawAmountDola: getBnToNumber(withdrawAmounts[i]) * dolaExRate,
          ...p,
        }
      }),
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