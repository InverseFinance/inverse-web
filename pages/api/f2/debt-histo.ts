import { Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { throttledPromises, utcDateStringToTimestamp } from '@app/util/misc';
import { FIRM_DEBT_HISTORY_INIT } from '@app/fixtures/firm-debt-history-init';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = 'firm-debt-histo-v1.0.7';
  const { cacheFirst } = req.query;
  try {
    const cacheDuration = 1800;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);    
    const { data: archived, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration) || { data: FIRM_DEBT_HISTORY_INIT, isValid: false };
    if (isValid && !!archived) {
      res.status(200).json(archived);
      return
    }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider(CHAIN_ID, '', true);

    const { data: archivedDailyUtcBlocks } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS };
    const dateBlockValues = Object.entries(archivedDailyUtcBlocks[CHAIN_ID]).map(([date, block]) => {
      return { date, block: parseInt(block) };
    });
    dateBlockValues.sort((a, b) => a.date > b.date ? 1 : -1);

    const startBlock = archived.blocks.length > 0 ? (archived.blocks[archived.blocks.length-1]+1) : F2_MARKETS.find(m => m.name === 'WETH').startingBlock;
    const newEntries = dateBlockValues.filter((d) => d.block > startBlock);
    
    const blocksToFetch = newEntries.map(d => d.block);
    const timestampsToFetch = newEntries.map(d => parseInt(utcDateStringToTimestamp(d.date)/1000));

    if(!blocksToFetch.length) {
      res.status(200).json(archived);
      return
    }
    
    const marketTemplate = new Contract(F2_MARKETS[0].address, F2_MARKET_ABI, provider);
    // Function signature and encoding
    const functionName = 'totalDebt';
    const functionSignature = marketTemplate.interface.getSighash(functionName);

    const newDebtsBn =
      await throttledPromises(
        (block: number) => {
          return Promise.all(F2_MARKETS.map((m, i) => {
            const market = new Contract(m.address, F2_MARKET_ABI, provider);
            return block >= m.startingBlock ?
              market.provider.call({
                to: m.address,
                data: functionSignature + '0000000000000000000000000000000000000000000000000000000000000000', // append 32 bytes of 0 for no arguments
              }, block) :
              new Promise((resolve) => resolve(null));
          }))
        },
        blocksToFetch,
        5,
        100,
      );

    const newDebts = newDebtsBn.map((d, i) => {
      return d.map((v, j) => v === null ? 0 : getBnToNumber(marketTemplate.interface.decodeFunctionResult(functionName, v)[0]));
    });

    const resultData = {
      debts: archived.debts.concat(newDebts),
      timestamp: +(new Date()),
      markets: F2_MARKETS.map(m => m.address),
      blocks: archived.blocks.concat(blocksToFetch),
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