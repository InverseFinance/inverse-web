import 'source-map-support'
import { getHistoricalProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj } from '@app/util/redis'
import { timestampToUTC } from '@app/util/misc';
import { addBlockTimestamps, getRedisCachedOnlyBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';

const CHAIN_START_BLOCKS = {
  [NetworkIds.mainnet]: 16155758,
  [NetworkIds.optimism]: 61968205,
  [NetworkIds.arbitrum]: 125683283,
  [NetworkIds.base]: 3694545,
  [NetworkIds.bsc]: 24435328,
}

const XCHAIN_DAYS_INTERVAL = 7;
const CHAIN_BLOCKS_INTERVALS = {
  [NetworkIds.optimism]: 1 / 2 * 86400 * XCHAIN_DAYS_INTERVAL,
  [NetworkIds.base]: 1 / 2 * 86400 * XCHAIN_DAYS_INTERVAL,
  [NetworkIds.arbitrum]: 1 / 0.3 * 86400 * XCHAIN_DAYS_INTERVAL,
  [NetworkIds.bsc]: 1 / 3 * 86400 * 3,
}

const CHAIN_IDS_TO_CATCH_UP = [NetworkIds.bsc];

const XCHAIN_TIMESTAMPS_CACHE_KEY = 'xchain-block-timestamps-unarchived';

const getXchainTimestamps = async () => {
  for (let chainId of CHAIN_IDS_TO_CATCH_UP) {
    const startingBlock = CHAIN_START_BLOCKS[chainId];
    const provider = getHistoricalProvider(chainId);
    const currentBlock = await provider.getBlockNumber();
    const intIncrement = Math.floor(CHAIN_BLOCKS_INTERVALS[chainId]);
    const nbIntervals = (currentBlock - startingBlock) / intIncrement;
    const nbDays = nbIntervals / XCHAIN_DAYS_INTERVAL;
    const blocks = Array.from({ length: Math.ceil(nbIntervals) }, (_, i) => startingBlock + i * intIncrement).filter(b => b < (currentBlock));
    if (nbDays >= 0.8) {
      blocks.push(currentBlock);
    }    
    await addBlockTimestamps(
      blocks,
      chainId,
      XCHAIN_TIMESTAMPS_CACHE_KEY,
    );    
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ success: false });
    else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) res.status(401).json({ success: false });
    
    const { data: archivedDateBlocks } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false);
    await getXchainTimestamps();

    const [
      // mainnetCachedTimestamps,
      xchainCachedTimestamps,
    ] = await Promise.all([
      // getRedisCachedOnlyBlockTimestamps(),
      getRedisCachedOnlyBlockTimestamps(XCHAIN_TIMESTAMPS_CACHE_KEY),
    ]);

    const cachedTimestamps = xchainCachedTimestamps//mergeDeep(mainnetCachedTimestamps, xchainCachedTimestamps);
    // per chain, map an utc date with a blockNumber
    const utcKeyBlockValues = { ...archivedDateBlocks };

    const chains = Object.keys(cachedTimestamps);
    
    chains.forEach(chainId => {
      if (!utcKeyBlockValues[chainId]) utcKeyBlockValues[chainId] = {};
      Object.entries(cachedTimestamps[chainId]).forEach(([block, ts]) => {        
        const utcDate = timestampToUTC(ts * 1000);        
        utcKeyBlockValues[chainId][utcDate] = block;
      });
    });

    // await redisSetWithTimestamp(DAILY_UTC_CACHE_KEY+'-v2', utcKeyBlockValues);    

    const results = {
      ...utcKeyBlockValues,
      // timestamp: Date.now(),
    }
    return res.status(200).send(results);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(DAILY_UTC_CACHE_KEY, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch (e) {
      console.error(e);
      res.status(500);
    }
  }
}