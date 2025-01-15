import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';

const { DBR } = getNetworkConfigConstants();

export const dbrReplenishmentsCacheKey = `f2dbr-replenishments-v1.0.0`;

export default async function handler(req, res) {  

  try {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(dbrReplenishmentsCacheKey, true, cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const dbrContract = new Contract(DBR, DBR_ABI, provider);

    const events = await dbrContract.queryFilter(dbrContract.filters.ForceReplenish());

    const blocks = events.map(e => e.blockNumber);

    const timestamps = await addBlockTimestamps(
      blocks,
      NetworkIds.mainnet,
    );    

    let daoFeeAcc = 0;

    const resultData = {
      events: events.map(e => {
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
      }),
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