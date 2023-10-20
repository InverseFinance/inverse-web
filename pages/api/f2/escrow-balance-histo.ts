import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI, F2_ALE_ABI, F2_ESCROW_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber, getToken } from '@app/util/markets'
import { BLOCKS_PER_DAY, BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { ascendingEventsSorter, throttledPromises } from '@app/util/misc';
import { CHAIN_TOKENS, TOKENS } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { formatFirmEvents } from '@app/util/f2';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { FEATURE_FLAGS } from '@app/config/features';

const { F2_MARKETS, DBR, F2_ALE } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account, escrow, market, firmActionIndex } = req.query;
  if (
    !account || !isAddress(account) || isInvalidGenericParam(account)
    || !market || !isAddress(market) || isInvalidGenericParam(market)
    || !escrow || !isAddress(escrow) || isInvalidGenericParam(escrow)
    || isInvalidGenericParam(firmActionIndex)
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const cacheKey = `firm-escrow-balance-histo-${escrow}-${CHAIN_ID}-v1.1.0`;
  try {
    const webCacheDuration = 3600;
    const redisCacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${webCacheDuration}`);
    const { data: archivedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', redisCacheDuration);
    if (isValid && (firmActionIndex === archivedData.firmActionIndex || cacheFirst === 'true')) {
      res.status(200).json(archivedData);
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
    const aleContract = new Contract(F2_ALE, F2_ALE_ABI, provider);
    const escrowCreations = await marketContract.queryFilter(marketContract.filters.CreateEscrow(account), _market.startingBlock);
    const escrowCreationBlock = escrowCreations.length > 0 ? escrowCreations[0].blockNumber : 0;

    if (!escrowCreationBlock) {
      res.status(400).json({ success: false, msg: 'no escrow' });
      return;
    }

    const archived = archivedData || { balances: [], debts: [], blocks: [], timestamps: [], dbrClaimables: [], formattedEvents: [] };
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
    if(FEATURE_FLAGS.firmLeverage) {
      eventsToQuery.push(aleContract.queryFilter(aleContract.filters.LeverageUp(_market.address, account), startingBlock));
      eventsToQuery.push(aleContract.queryFilter(aleContract.filters.LeverageDown(_market.address, account), startingBlock));
    }

    if (_market.isInv) {
      eventsToQuery.push(dbrContract.queryFilter(dbrContract.filters.Transfer(BURN_ADDRESS, account), startingBlock))
    }

    const queryResults = await Promise.all(eventsToQuery);
    const flatenedEvents = queryResults.flat().sort(ascendingEventsSorter);
    const escrowRelevantBlockNumbers = flatenedEvents.map(e => e.blockNumber);
    const lastEscrowEventBlock = Math.max(...escrowRelevantBlockNumbers);

    const intIncrement = Math.floor(BLOCKS_PER_DAY);

    const nbIntervals = Math.floor((currentBlock - startingBlock) / intIncrement);

    const blocksFromStartUntilCurrent = [...Array(nbIntervals).keys()].map((i) => startingBlock + (i * intIncrement));
    const allUniqueBlocksToCheck = [...new Set([...escrowRelevantBlockNumbers, ...blocksFromStartUntilCurrent])];
    allUniqueBlocksToCheck.sort((a, b) => a - b);

    const escrowContract = new Contract(escrow, F2_ESCROW_ABI, provider);

    const balanceFunctionName = 'balance';
    const claimableFunctionName = 'claimable';
    const debtFunctionName = 'debts';

    if (!allUniqueBlocksToCheck.length || ((currentBlock - lastEscrowEventBlock) < BLOCKS_PER_DAY && lastArchivedBlock === lastEscrowEventBlock && archived?.firmActionIndex === firmActionIndex)) {
      res.status(200).json(archived);
      return;
    }
    const timeChainId = CHAIN_ID === '31337' ? '1' : CHAIN_ID;
    await addBlockTimestamps(
      allUniqueBlocksToCheck,
      timeChainId,
    );
    const timestamps = await getCachedBlockTimestamps();
    const decimals = getToken(CHAIN_TOKENS[CHAIN_ID], _market.collateral).decimals;

    const batchedData = await throttledPromises(
      (block: number) => {
        return getGroupedMulticallOutputs([
          { contract: escrowContract, functionName: balanceFunctionName },
          { contract: escrowContract, functionName: claimableFunctionName, forceFallback: !_market.isInv, fallbackValue: BigNumber.from(0) },
          { contract: marketContract, functionName: debtFunctionName, params: [account], forceFallback: block < _market.borrowingWasDisabledBeforeBlock, fallbackValue: BigNumber.from(0) },          
        ],
          Number(CHAIN_ID),
          block,
        );
      },
      allUniqueBlocksToCheck,
      5,
      100,
    );

    const newBalances = batchedData.map(t => getBnToNumber(t[0], decimals));
    const newDbrClaimables = batchedData.map(t => getBnToNumber(t[1]));
    const newDebts = batchedData.map(t => getBnToNumber(t[2]));

    const resultTimestamps = archived.timestamps.concat(allUniqueBlocksToCheck.map(b => timestamps[timeChainId][b] * 1000));
    const {
      events: newFormattedEvents,
      debt,
      depositedByUser,
      unstakedCollateralBalance,
      liquidated,
      replenished,
      claims,
    } = formatFirmEvents(_market, flatenedEvents, flatenedEvents.map(e => timestamps[timeChainId][e.blockNumber] * 1000), archived?.formattedEvents?.length > 0 ? archived : undefined);
    
    const resultData = {
      timestamp: Date.now(),
      firmActionIndex,
      debt,
      depositedByUser,
      unstakedCollateralBalance,
      liquidated,
      replenished,
      claims,
      balances: archived.balances.concat(newBalances),
      debts: archived.debts.concat(newDebts),
      dbrClaimables: archived.dbrClaimables.concat(newDbrClaimables),  
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