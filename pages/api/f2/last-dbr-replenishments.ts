import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { isAddress } from 'ethers/lib/utils';
import { estimateBlockTimestamp } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';

const { DBR } = getNetworkConfigConstants();

export const lastDBRReplenishmentsCacheKey = `last-dbr-replenishments-v1.0.1`;

export default async function handler(req, res) {
  const { account } = req.query;
  if(!!account && !isAddress(account)) {
    return res.status(400).json({ success: false, error: 'Invalid account address' });
  }
  const cacheKey = account ? `account-replenishments-${account}` : lastDBRReplenishmentsCacheKey;
  const needChunks = !account;  
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration, needChunks);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const dbrContract = new Contract(DBR, DBR_ABI, provider);
    const lastBlock = cachedData?.events?.length ? cachedData?.events[cachedData.events.length-1].blockNumber : undefined;
    
    let events: any[] = [];

    const currentBlock = await provider.getBlockNumber();
    const now = Date.now();

    const getLargeLogsFunction = () => {
      return getLargeLogs(
        dbrContract,
        dbrContract.filters.ForceReplenish(account || undefined),
        lastBlock ? lastBlock+1 : currentBlock - 50_000,
        currentBlock,
        10_000,
      );
    }

    let isLimited = false;
    try {
      if(!account) {
        events = await getLargeLogsFunction();
      } else {
        events = await dbrContract.queryFilter(dbrContract.filters.ForceReplenish(account || undefined), lastBlock ? lastBlock+1 : undefined);
      }
    } catch (e) {
      console.log('e', e);
      if(!!account){
        isLimited = true;
        console.log('fetching with large log function');
        events = await getLargeLogsFunction();
      }
    }

    events = events.slice(-100);

    const cachedEvents = cachedData?.events || [];

    const newEvents = events.map(e => {
      const replenishmentCost = getBnToNumber(e.args?.replenishmentCost);
      const replenisherReward = getBnToNumber(e.args?.replenisherReward);
      const daoDolaReward = replenishmentCost - replenisherReward;
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(e.blockNumber, now, currentBlock),
        account: e.args?.account,
        replenisher: e.args?.replenisher,
        marketAddress: e.args?.market,
        deficit: getBnToNumber(e.args?.deficit),
        replenishmentCost,
        replenisherReward,
        daoDolaReward,
      }
    });

    const resultData = {
      timestamp: now,
      isLimited,
      events: cachedEvents.concat(newEvents).slice(-100),
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