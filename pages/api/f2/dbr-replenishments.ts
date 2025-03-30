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
import { isAddress } from 'ethers/lib/utils';

const { DBR } = getNetworkConfigConstants();

export const dbrReplenishmentsCacheKey = `f2dbr-replenishments-v1.1.0`;

export default async function handler(req, res) {
  const { account } = req.query;
  if(!!account && !isAddress(account)) {
    return res.status(400).json({ success: false, error: 'Invalid account address' });
  }
  const cacheKey = account ? `account-replenishments-${account}` : dbrReplenishmentsCacheKey;
  const needChunks = !account;  
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    const { isValid, data: cachedData } = (await getCacheFromRedisAsObj(cacheKey, true, cacheDuration, needChunks) || { isValid: false, data: !account ? ARCHIVED_REPLENISHMENTS : {events: []} });
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const dbrContract = new Contract(DBR, DBR_ABI, provider);
    const lastBlock = cachedData?.events?.length ? cachedData?.events[cachedData.events.length-1].blockNumber : undefined;
    
    let events: any[] = [];
    let isLimited = false;
    try {
      events = await dbrContract.queryFilter(dbrContract.filters.ForceReplenish(account || undefined), lastBlock ? lastBlock+1 : undefined);
    } catch (e) {
      console.log('e', e);
      if(!!account) {
        console.error('fetching with limited range');
        isLimited = true;
        const currentBlock = await provider.getBlockNumber();
        events = await dbrContract.queryFilter(dbrContract.filters.ForceReplenish(account || undefined), (currentBlock-1990));        
      }
    }

    // account: last 50 events maximum
    if(!!account) {
      events = events.slice(-50);
    }

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
      isLimited,
      events: !!account ? cachedEvents.concat(newEvents).slice(-100) : cachedEvents.concat(newEvents),
      timestamp: (+(new Date())-1000),
    }

    await redisSetWithTimestamp(cacheKey, resultData, needChunks);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false, 0, needChunks);
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