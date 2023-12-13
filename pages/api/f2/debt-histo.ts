import { Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { throttledPromises } from '@app/util/misc';
import { FIRM_DEBT_HISTORY_INIT } from '@app/fixtures/firm-debt-history-init';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = 'firm-debt-histo-v1.0.7';
  const { cacheFirst } = req.query;
  try {
    const cacheDuration = 1800;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider(CHAIN_ID, '', true);

    const currentBlock = await provider.getBlockNumber();
    const archived = await getCacheFromRedis(cacheKey, false, 0) || FIRM_DEBT_HISTORY_INIT;
    const intIncrement = Math.floor(BLOCKS_PER_DAY/3);
    const lastBlock = archived.blocks[archived.blocks.length - 1];
    // skip if last block is less than 5 blocks ago
    if(currentBlock - lastBlock < 5) {
      console.log('Skipping debt histo update, last block is less than 5 blocks ago')
      res.status(200).json(archived);
      return;
    }
    const startingBlock = lastBlock + intIncrement < currentBlock ? lastBlock + intIncrement : currentBlock;

    const nbDays = Math.floor((currentBlock - startingBlock) / intIncrement);

    const blocksFromStartUntilCurrent = [...Array(nbDays).keys()].map((i) => startingBlock + (i * intIncrement));
    const marketTemplate = new Contract(F2_MARKETS[0].address, F2_MARKET_ABI, provider);
    // Function signature and encoding
    const functionName = 'totalDebt';
    const functionSignature = marketTemplate.interface.getSighash(functionName);

    if (!blocksFromStartUntilCurrent.includes(currentBlock) && !archived.blocks.includes(currentBlock)) {
      blocksFromStartUntilCurrent.push(currentBlock);
    }

    if (!blocksFromStartUntilCurrent.length) {      
      res.status(200).json(archived);
      return;
    }

    const timestamps = await addBlockTimestamps(
      blocksFromStartUntilCurrent,
      NetworkIds.mainnet,
    );    

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
        blocksFromStartUntilCurrent,
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
      blocks: archived.blocks.concat(blocksFromStartUntilCurrent),
      timestamps: archived.timestamps.concat(blocksFromStartUntilCurrent.map(b => timestamps[NetworkIds.mainnet][b])),
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