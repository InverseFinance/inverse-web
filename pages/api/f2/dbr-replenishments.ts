import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { ARCHIVED_REPLENISHMENTS } from '@app/fixtures/replenishments';

const { DBR } = getNetworkConfigConstants();

export const dbrReplenishmentsCacheKey = `f2dbr-replenishments-v1.1.0`;

export default async function handler(req, res) {  

  try {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { isValid, data: cachedData } = (await getCacheFromRedisAsObj(dbrReplenishmentsCacheKey, true, cacheDuration, true) || { isValid: false, data: ARCHIVED_REPLENISHMENTS });
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const dbrContract = new Contract(DBR, DBR_ABI, provider);
    const lastBlock = cachedData?.events?.length ? cachedData?.events[cachedData.events.length-1].blockNumber : undefined;
    const events = await dbrContract.queryFilter(dbrContract.filters.ForceReplenish(), lastBlock ? lastBlock+1 : undefined);

    const blocks = events.map(e => e.blockNumber);

    const timestamps = await addBlockTimestamps(
      blocks,
      NetworkIds.mainnet,
    );

    const cachedEvents = cachedData?.events || [];

    let daoFeeAcc = cachedEvents?.length ? cachedEvents[cachedEvents.length-1].daoFeeAcc : 0;

    const newEvents = events.map(e => {
      const replenishmentCost = getBnToNumber(e.args?.replenishmentCost);
      const replenisherReward = getBnToNumber(e.args?.replenisherReward);
      const daoDolaReward = replenishmentCost - replenisherReward;
      daoFeeAcc += daoDolaReward;
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: timestamps[NetworkIds.mainnet][e.blockNumber] * 1000,
        account: e.args?.account,
        replenisher: e.args?.replenisher,
        marketAddress: e.args?.market,
        deficit: getBnToNumber(e.args?.deficit),
        replenishmentCost,
        replenisherReward,
        daoDolaReward,
        daoFeeAcc,
      }
    });

    const resultData = {
      events: cachedEvents.concat(newEvents),
      timestamp: (+(new Date())-1000),
    }

    await redisSetWithTimestamp(dbrReplenishmentsCacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(dbrReplenishmentsCacheKey, false);
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