import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI, F2_ESCROW_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber, getToken } from '@app/util/markets'
import { BLOCKS_PER_DAY, BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { throttledPromises } from '@app/util/misc';
import { CHAIN_TOKENS } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';

const { F2_MARKETS, DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account, escrow, market } = req.query;
  if (
    !account || !isAddress(account) || isInvalidGenericParam(account)
    || !market || !isAddress(market) || isInvalidGenericParam(market)
    || !escrow || !isAddress(escrow) || isInvalidGenericParam(escrow)
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const cacheKey = `firm-escrow-balance-histo-${escrow}-v1.0.8`;
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

    const archived = await getCacheFromRedis(cacheKey, false, 0) || { balances: [], blocks: [], timestamps: [], dbrClaimables: [] };
    const lastBlock = archived.blocks.length > 0 ? archived.blocks[archived.blocks.length - 1] : escrowCreationBlock - 1;

    const startingBlock = lastBlock + 1 < currentBlock ? lastBlock + 1 : currentBlock;
    // events impacting escrow balance
    const eventsToQuery = [
      marketContract.queryFilter(marketContract.filters.Deposit(account), startingBlock),
      marketContract.queryFilter(marketContract.filters.Withdraw(account), startingBlock),
      marketContract.queryFilter(marketContract.filters.Liquidate(account), startingBlock),
    ];

    if (_market.isInv) {
      const dbrContract = new Contract(DBR, DBR_ABI, provider);
      eventsToQuery.push(dbrContract.queryFilter(dbrContract.filters.Transfer(BURN_ADDRESS, account), startingBlock))
    }

    const escrowRelevantBlockNumbers = (await Promise.all(eventsToQuery)).flat().map(e => e.blockNumber);

    const intIncrement = Math.floor(BLOCKS_PER_DAY * 3);

    const nbIntervals = Math.floor((currentBlock - startingBlock) / intIncrement);

    const blocksFromStartUntilCurrent = [...Array(nbIntervals).keys()].map((i) => startingBlock + (i * intIncrement));
    const allUniqueBlocksToCheck = [...new Set([...escrowRelevantBlockNumbers, ...blocksFromStartUntilCurrent])];
    allUniqueBlocksToCheck.sort((a, b) => a - b);

    const escrowContract = new Contract(escrow, F2_ESCROW_ABI, provider);
    // Function signature and encoding
    const balanceFunctionName = 'balance';
    const balanceFunctionSignature = escrowContract.interface.getSighash(balanceFunctionName);

    const claimableFunctionName = 'claimable';
    const claimableFunctionSignature = escrowContract.interface.getSighash(claimableFunctionName);

    if (!allUniqueBlocksToCheck.includes(currentBlock) && !archived?.blocks.includes(currentBlock)) {
      allUniqueBlocksToCheck.push(currentBlock);
    }

    if (!allUniqueBlocksToCheck.length) {
      res.status(200).json(archived);
      return;
    }

    await addBlockTimestamps(
      allUniqueBlocksToCheck,
      CHAIN_ID,
    );
    const timestamps = await getCachedBlockTimestamps();

    const newBalancesBn =
      await throttledPromises(
        (block: number) => {
          return escrowContract.provider.call({
            to: escrowContract.address,
            data: balanceFunctionSignature + '0000000000000000000000000000000000000000000000000000000000000000', // append 32 bytes of 0 for no arguments
          }, block)
        },
        allUniqueBlocksToCheck,
        5,
        100,
      );

    let newClaimableBn = [];
    if (_market.isInv) {
      newClaimableBn =
        await throttledPromises(
          (block: number) => {
            return escrowContract.provider.call({
              to: escrowContract.address,
              data: claimableFunctionSignature + '0000000000000000000000000000000000000000000000000000000000000000', // append 32 bytes of 0 for no arguments
            }, block)
          },
          allUniqueBlocksToCheck,
          5,
          100,
        );
    }

    const decimals = getToken(CHAIN_TOKENS[CHAIN_ID], _market.collateral).decimals;

    const newBalances = newBalancesBn.map((d, i) => {
      return getBnToNumber(escrowContract.interface.decodeFunctionResult(balanceFunctionName, d)[0], decimals);
    });

    const newDbrClaimables = newClaimableBn.map((d, i) => {
      return getBnToNumber(escrowContract.interface.decodeFunctionResult(claimableFunctionName, d)[0], 18);
    });

    const resultData = {
      balances: archived.balances.concat(newBalances),
      dbrClaimables: archived.dbrClaimables.concat(newDbrClaimables),
      timestamp: Date.now(),
      blocks: archived?.blocks.concat(allUniqueBlocksToCheck),
      timestamps: archived.timestamps.concat(allUniqueBlocksToCheck.map(b => timestamps[CHAIN_ID][b])),
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