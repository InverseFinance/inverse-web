import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI, F2_ESCROW_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getHistoricValue, getProvider } from '@app/util/providers';
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber, getToken } from '@app/util/markets'
import { BLOCKS_PER_DAY, BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { ascendingEventsSorter, throttledPromises } from '@app/util/misc';
import { CHAIN_TOKENS, TOKENS } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { formatFirmEvents } from '@app/util/f2';

const { F2_MARKETS, DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account, escrow, market, lastBlock } = req.query;
  if (
    !account || !isAddress(account) || isInvalidGenericParam(account)
    || !market || !isAddress(market) || isInvalidGenericParam(market)
    || !escrow || !isAddress(escrow) || isInvalidGenericParam(escrow)
    || isInvalidGenericParam(lastBlock)
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const cacheKey = `firm-escrow-balance-histo-${escrow}-${lastBlock}-${CHAIN_ID}-v1.0.97`;
  try {
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration, true);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider(CHAIN_ID, '', true);
    const _market = F2_MARKETS.find(m => m.address === market);
    _market.underlying = TOKENS[_market.collateral];

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

    const archived = await getCacheFromRedis(cacheKey, false, 0) || { balances: [], debts: [], blocks: [], timestamps: [], dbrClaimables: [], formattedEvents: [] };
    const lastArchivedBlock = archived.blocks.length > 0 ? archived.blocks[archived.blocks.length - 1] : escrowCreationBlock - 1;

    const startingBlock = lastArchivedBlock + 1 < currentBlock ? lastArchivedBlock + 1 : currentBlock;

    const dbrContract = new Contract(DBR, DBR_ABI, provider);
    // events impacting escrow balance or visible on the chart
    const eventsToQuery = [
      marketContract.queryFilter(marketContract.filters.Deposit(account), startingBlock),
      marketContract.queryFilter(marketContract.filters.Withdraw(account), startingBlock),
      marketContract.queryFilter(marketContract.filters.Liquidate(account), startingBlock),
      marketContract.queryFilter(marketContract.filters.Repay(account), startingBlock),
      marketContract.queryFilter(marketContract.filters.Borrow(account), startingBlock),
      dbrContract.queryFilter(dbrContract.filters.ForceReplenish(account, undefined, _market.address), startingBlock),
    ];

    if (_market.isInv) {
      eventsToQuery.push(dbrContract.queryFilter(dbrContract.filters.Transfer(BURN_ADDRESS, account), startingBlock))
    }

    const queryResults = await Promise.all(eventsToQuery);
    const flatenedEvents = queryResults.flat().sort(ascendingEventsSorter);
    const escrowRelevantBlockNumbers = flatenedEvents.map(e => e.blockNumber);
    const lastEscrowEventBlock = Math.max(...escrowRelevantBlockNumbers);

    const intIncrement = Math.floor(BLOCKS_PER_DAY * 3);

    const nbIntervals = Math.floor((currentBlock - startingBlock) / intIncrement);

    const blocksFromStartUntilCurrent = [...Array(nbIntervals).keys()].map((i) => startingBlock + (i * intIncrement));
    const allUniqueBlocksToCheck = [...new Set([...escrowRelevantBlockNumbers, ...blocksFromStartUntilCurrent])];
    allUniqueBlocksToCheck.sort((a, b) => a - b);

    const escrowContract = new Contract(escrow, F2_ESCROW_ABI, provider);

    const balanceFunctionName = 'balance';
    const claimableFunctionName = 'claimable';
    const debtFunctionName = 'debts';

    if (!allUniqueBlocksToCheck.includes(currentBlock) && !archived?.blocks.includes(currentBlock)) {
      allUniqueBlocksToCheck.push(currentBlock);
    }

    if (!allUniqueBlocksToCheck.length || ((currentBlock - lastEscrowEventBlock) <= 1000)) {
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
          return getHistoricValue(escrowContract, block, balanceFunctionName, []);
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
            return getHistoricValue(escrowContract, block, claimableFunctionName, []);
          },
          allUniqueBlocksToCheck,
          5,
          100,
        );
    }

    let newDebtsBn = await throttledPromises(
      (block: number) => {
        return block < _market.borrowingWasDisabledBeforeBlock ?
          Promise.resolve('0x0000000000000000000000000000000000000000000000000000000000000000') :
          getHistoricValue(marketContract, block, debtFunctionName, [account]);
      },
      allUniqueBlocksToCheck,
      5,
      100,
    );

    const decimals = getToken(CHAIN_TOKENS[CHAIN_ID], _market.collateral).decimals;

    const newBalances = newBalancesBn.map((d, i) => {
      return getBnToNumber(escrowContract.interface.decodeFunctionResult(balanceFunctionName, d)[0], decimals);
    });

    const newDbrClaimables = newClaimableBn.map((d, i) => {
      return getBnToNumber(escrowContract.interface.decodeFunctionResult(claimableFunctionName, d)[0], 18);
    });

    const newDebts = newDebtsBn.map((d, i) => {
      return getBnToNumber(marketContract.interface.decodeFunctionResult(debtFunctionName, d)[0], 18);
    });

    const resultTimestamps = archived.timestamps.concat(allUniqueBlocksToCheck.map(b => timestamps[CHAIN_ID][b] * 1000));
    const {
      events: newFormattedEvents,
      debt,
      depositedByUser,
      unstakedCollateralBalance,
      liquidated,
      replenished,
      claims,
    } = formatFirmEvents(_market, flatenedEvents, flatenedEvents.map(e => timestamps[CHAIN_ID][e.blockNumber] * 1000), archived?.formattedEvents?.length > 0 ? archived : undefined);

    const resultData = {
      debt,
      depositedByUser,
      unstakedCollateralBalance,
      liquidated,
      replenished,
      claims,
      balances: archived.balances.concat(newBalances),
      debts: archived.debts.concat(newDebts),
      dbrClaimables: archived.dbrClaimables.concat(newDbrClaimables),
      timestamp: Date.now(),
      blocks: archived?.blocks.concat(allUniqueBlocksToCheck),
      timestamps: resultTimestamps,
      formattedEvents: archived.formattedEvents.concat(newFormattedEvents),
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