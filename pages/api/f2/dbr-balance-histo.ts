import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { throttledPromises, utcDateStringToTimestamp } from '@app/util/misc';
import { isAddress } from 'ethers/lib/utils';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { NetworkIds } from '@app/types';

const { DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account } = req.query;
  if (
    !account || !isAddress(account) || isInvalidGenericParam(account)
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const cacheKey = `user-dbr-balance-histo-${account}-v1.0.4`;
  try {
    const webCacheDuration = 3600;
    const redisCacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${webCacheDuration}`);
    const { data: archivedUserData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', redisCacheDuration);

    if (isValid && (cacheFirst === 'true')) {
      res.status(200).json(archivedUserData);
      return
    }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider(CHAIN_ID, '', true);
    const dbrContract = new Contract(DBR, DBR_ABI, provider);

    const transferEvents = await dbrContract.queryFilter(dbrContract.filters.Transfer(undefined, account));
    if(!transferEvents.length) {
      res.status(400).json({ success: false, msg: 'no history', balances: [], debts: [], timestamps: [], blocks: [] });
      return;
    }
       
    const archived = archivedUserData || { balances: [], blocks: [], timestamps: [], debts: [] };

    const { data: archivedTimeData } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS };
    const dateBlockValues = Object.entries(archivedTimeData[CHAIN_ID]).map(([date, block]) => {
      return { date, block: parseInt(block) };
    });
    dateBlockValues.sort((a, b) => a.date > b.date ? 1 : -1);

    const startBlock = archived.blocks.length > 0 ? (archived.blocks[archived.blocks.length-1]+1) : (transferEvents[0].blockNumber-1);
    const newEntries = dateBlockValues.filter((d) => d.block > startBlock);
        
    const blocksToFetch = newEntries.map(d => d.block);
    const timestampsToFetch = newEntries.map(d => utcDateStringToTimestamp(d.date));

    if(!blocksToFetch.length) {
      res.status(200).json(archivedUserData);
      return
    }
    
    const batchedData = await throttledPromises(
      (block: number) => {
        return getGroupedMulticallOutputs([
          { contract: dbrContract, functionName: 'signedBalanceOf', params: [account] },
          { contract: dbrContract, functionName: 'debts', params: [account] },
        ], parseInt(NetworkIds.mainnet), block);
      },
      blocksToFetch,
      5,
      100,
    );

    const newBalances = batchedData.map(t => getBnToNumber(t[0]));
    const newDebts = batchedData.map(t => getBnToNumber(t[1]));

    const resultData = {
      timestamp: Date.now(),
      balances: archived.balances.concat(newBalances),
      debts: archived.debts.concat(newDebts),
      blocks: archived?.blocks.concat(blocksToFetch),
      timestamps: archived.timestamps.concat(timestampsToFetch),
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
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