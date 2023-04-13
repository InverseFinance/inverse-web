import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { throttledPromises } from '@app/util/misc';
import { FIRM_DEBT_HISTORY_INIT } from '@app/fixtures/firm-debt-history-init';

const { F2_MARKETS } = getNetworkConfigConstants();

const cacheKey = 'firm-debt-histo-v1.0.0';

export default async function handler(req, res) {
  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 3600, true);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }
    
    const provider = getProvider(CHAIN_ID);
    const currentBlock = await provider.getBlockNumber();
    const archived = await getCacheFromRedis(cacheKey, false, 0, true) || FIRM_DEBT_HISTORY_INIT;
    const intBlockPerDay = Math.floor(BLOCKS_PER_DAY);
    const startingBlock = archived.blocks[archived.blocks.length - 1] + intBlockPerDay;    
    const nbDays = Math.floor((currentBlock - startingBlock) / intBlockPerDay);
    const blocksFromStartUntilCurrent = [...Array(nbDays).keys()].map((i) => startingBlock + (i * intBlockPerDay));

    if(!blocksFromStartUntilCurrent.length) {
      res.status(200).json(archived);
    }

    await addBlockTimestamps(
      blocksFromStartUntilCurrent,
      NetworkIds.mainnet,
    );
    const timestamps = await getCachedBlockTimestamps();

    const newDebtsBn =
      await throttledPromises(
        (block: number) => {
          return Promise.all(F2_MARKETS.map((m, i) => {
            const market = new Contract(m.address, F2_MARKET_ABI, provider);
            return block >= m.startingBlock ?
              market.totalDebt({ blockTag: block }) :
              new Promise((resolve) => resolve(BigNumber.from('0')));
          }))
        },
        blocksFromStartUntilCurrent,
        5,
        100,
      );

    const newDebts = newDebtsBn.map((d, i) => {
      return d.map((bn, j) => getBnToNumber(bn));
    })

    const resultData = {
      debts: archived.debts.concat(newDebts),
      timestamp: +(new Date()),
      markets: F2_MARKETS.map(m => m.address),
      blocks: archived.blocks.concat(blocksFromStartUntilCurrent),
      timestamps: archived.timestamps.concat(blocksFromStartUntilCurrent.map(b => timestamps[NetworkIds.mainnet][b])),
    }

    await redisSetWithTimestamp(cacheKey, resultData, true);

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