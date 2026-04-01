import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'

import { JDOLA_AUCTION_ADDRESS, JUNIOR_ESCROW_ADDRESS } from '@app/config/constants';
import { getTokenHolders } from '@app/util/covalent';
import { jdolaStakingCacheKey } from './jdola-staking';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { getProvider } from '@app/util/providers';
import { getJuniorEscrowContract, getJrdolaContract } from '@app/util/junior';
import { getBnToNumber } from '@app/util/markets';

export default async function handler(req, res) {
  const cacheDuration = 120;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

  const { cacheFirst } = req.query;

  const cacheKey = `jrdola-stakers-v1.0.1`;
  try {

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

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

    const holders = holdersData?.data?.items;

    const provider = getProvider(1);
    const escrowContract = getJuniorEscrowContract(provider)
    const jrDolaContract = getJrdolaContract(provider)

    const currentHoldersAccount = holders.map(h => h.address.toLowerCase());
    const queueEvents = await escrowContract.queryFilter(escrowContract.filters.Queue());
    
    const withdrawers = queueEvents.map(e => e.args[0]);
    const totalAccounts = [...new Set(currentHoldersAccount.concat(withdrawers))]
      .filter(a => a.toLowerCase() !== JUNIOR_ESCROW_ADDRESS.toLowerCase());

    const [
      withdrawAmounts,
      exitWindows,
      balances,
    ] = await getGroupedMulticallOutputs([
      totalAccounts.map((p) => ({ contract: escrowContract, functionName: 'withdrawAmounts', params: [p] })),
      totalAccounts.map((p) => ({ contract: escrowContract, functionName: 'exitWindows', params: [p] })),
      totalAccounts.map((p) => ({ contract: jrDolaContract, functionName: 'balanceOf', params: [p] })),
    ], 1, undefined, provider, true);

    const now = Date.now();

    const resultData = {
      errorOrNotSupported: !holdersData,
      timestamp: now,
      positions: totalAccounts.map((p,i) => {
        const balance = getBnToNumber(balances[i]);
        const balanceInDola = balance * dolaExRate;
        const [start, end] = exitWindows[i];
        const startMs = getBnToNumber(start, 0) * 1000;
        const endMs = getBnToNumber(end, 0) * 1000;
        const isBefore = now < startMs;
        const isExpired = now > endMs;
        const isWithin = now <= endMs && now >= startMs;
        const withdrawStatus = endMs === 0 ? 'none' : isBefore ? 'queued' : isExpired ? 'expired' : 'active';
        return {
          balance,
          balanceInDola,
          isBefore,
          isExpired,
          isWithin,
          startMs: ['queued', 'active'].includes(withdrawStatus) ? startMs : 0,
          endMs: ['queued', 'active'].includes(withdrawStatus) ? endMs : 0,
          withdrawStatus,
          withdrawAmount: getBnToNumber(withdrawAmounts[i]),
          withdrawAmountDola: getBnToNumber(withdrawAmounts[i]) * dolaExRate,
          account: p,
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