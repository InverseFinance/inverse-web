import { Contract } from 'ethers'
import 'source-map-support'
import { F2_ESCROW_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber, getToken } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { throttledPromises } from '@app/util/misc';
import { CHAIN_TOKENS } from '@app/variables/tokens';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account, escrow, market } = req.query;
  const cacheKey = `firm-escrow-balance-histo-${escrow}-v1.0.0`;
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
    const _market = F2_MARKETS.find(m => m.address === market);

    if (!_market) {
      res.status(404).json({ success: false });
      return;
    }

    const currentBlock = await provider.getBlockNumber();
    const marketContract = new Contract(_market.address, F2_MARKET_ABI, provider);
    const escrowCreations = await marketContract.queryFilter(marketContract.filters.CreateEscrow(account), _market.startingBlock);
    const escrowCreationBlock = escrowCreations.length > 0 ? escrowCreations[0].blockNumber : 0;

    if (!escrowCreationBlock) {
      res.status(400).json({ success: false, msg: 'no escrow' });
      return;
    }

    const archived = await getCacheFromRedis(cacheKey, false, 0) || { balances: [], blocks: [escrowCreationBlock], timestamps: [] };
    const intIncrement = Math.floor(BLOCKS_PER_DAY);
    const lastBlock = archived.blocks[archived.blocks.length - 1];
    // skip if last block is less than 5 blocks ago
    if (currentBlock - lastBlock < intIncrement) {
      console.log('Skipping, last block is too recent')
      res.status(200).json(archived);
      return;
    }
    const startingBlock = lastBlock + intIncrement < currentBlock ? lastBlock + intIncrement : currentBlock;

    const nbDays = Math.floor((currentBlock - startingBlock) / intIncrement);

    const blocksFromStartUntilCurrent = [...Array(nbDays).keys()].map((i) => startingBlock + (i * intIncrement));
    const escrowContract = new Contract(escrow, F2_ESCROW_ABI, provider);
    // Function signature and encoding
    const functionName = 'balance';
    const functionSignature = escrowContract.interface.getSighash(functionName);

    if (!blocksFromStartUntilCurrent.includes(currentBlock) && !archived?.blocks.includes(currentBlock)) {
      blocksFromStartUntilCurrent.push(currentBlock);
    }

    if (!blocksFromStartUntilCurrent.length) {
      res.status(200).json(archived);
      return;
    }

    await addBlockTimestamps(
      blocksFromStartUntilCurrent,
      NetworkIds.mainnet,
    );
    const timestamps = await getCachedBlockTimestamps();

    const newBalancesBn =
      await throttledPromises(
        (block: number) => {
          return escrowContract.provider.call({
            to: escrowContract.address,
            data: functionSignature + '0000000000000000000000000000000000000000000000000000000000000000', // append 32 bytes of 0 for no arguments
          }, block)
        },
        blocksFromStartUntilCurrent,
        5,
        100,
      );

    const decimals = getToken(CHAIN_TOKENS[CHAIN_ID], _market.collateral).decimals;

    const newBalances = newBalancesBn.map((d, i) => {
      return getBnToNumber(escrowContract.interface.decodeFunctionResult(functionName, d)[0], decimals);
    });

    const resultData = {
      balances: archived.balances.concat(newBalances),
      timestamp: Date.now(),
      blocks: archived?.blocks.concat(blocksFromStartUntilCurrent),
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