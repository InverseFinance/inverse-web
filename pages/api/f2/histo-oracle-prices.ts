import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI, F2_ORACLE_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BLOCKS_PER_DAY, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps } from '@app/util/timestamps';
import { ascendingEventsSorter, throttledPromises } from '@app/util/misc';
import { TOKENS } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { getGroupedMulticallOutputs, getMulticallOutput } from '@app/util/multicall';

const { F2_MARKETS, F2_ORACLE } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, market } = req.query;
  if (
    !market || !isAddress(market) || isInvalidGenericParam(market)
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const _market = F2_MARKETS.find(m => m.address === market);
  const cacheKey = `firm-oracle-prices-${_market.isInv ? 'inverse' : market}-v1.0.0`;
  
  try {
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: validCache, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (isValid) {
      res.status(200).json(validCache);
      return
    }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider(CHAIN_ID, '', true);    
    _market.underlying = TOKENS[_market.collateral];

    if (!_market) {
      res.status(404).json({ success: false });
      return;
    }

    const currentBlock = await provider.getBlockNumber();
    const marketContract = new Contract(_market.address, F2_MARKET_ABI, provider);

    const archived = validCache || { blocks: [], timestamps: [], oraclePrices: [], collateralFactors: [] };
    const lastArchivedBlock = archived.blocks.length > 0 ? archived.blocks[archived.blocks.length - 1] : (_market.oracleStartingBlock || _market.startingBlock) - 1;

    const startingBlock = lastArchivedBlock + 1 < currentBlock ? lastArchivedBlock + 1 : currentBlock;

    const oracleContract = new Contract(F2_ORACLE, F2_ORACLE_ABI, provider);
    // events of the market
    const eventsToQuery = [
      marketContract.queryFilter(marketContract.filters.Deposit(), startingBlock),
      marketContract.queryFilter(marketContract.filters.Withdraw(), startingBlock),
      marketContract.queryFilter(marketContract.filters.Liquidate(), startingBlock),
      marketContract.queryFilter(marketContract.filters.Repay(), startingBlock),
      marketContract.queryFilter(marketContract.filters.Borrow(), startingBlock),
    ];

    const queryResults = await Promise.all(eventsToQuery);
    const flatenedEvents = queryResults.flat().sort(ascendingEventsSorter);
    const relevantBlockNumbers = flatenedEvents.map(e => e.blockNumber);
    const lastMarketEventBlock = Math.max(...relevantBlockNumbers);

    const intIncrement = Math.floor(BLOCKS_PER_DAY);

    const nbIntervals = Math.floor((currentBlock - startingBlock) / intIncrement);

    const blocksFromStartUntilCurrent = [...Array(nbIntervals).keys()].map((i) => startingBlock + (i * intIncrement));
    const allUniqueBlocksToCheck = [...new Set([...relevantBlockNumbers, ...blocksFromStartUntilCurrent])];
    allUniqueBlocksToCheck.sort((a, b) => a - b);

    if (!allUniqueBlocksToCheck.length || ((currentBlock - lastMarketEventBlock) < BLOCKS_PER_DAY && lastArchivedBlock === lastMarketEventBlock)) {
      res.status(200).json(archived);
      return;
    }

    const timestamps = await addBlockTimestamps(
      allUniqueBlocksToCheck,
      CHAIN_ID,
    );
    
    const batchedData = await throttledPromises(
      (block: number) => {
        return getGroupedMulticallOutputs([          
          { contract: marketContract, functionName: 'collateralFactorBps', params: [] },
        ],
          Number(CHAIN_ID),
          block,
        );
      },
      allUniqueBlocksToCheck,
      5,
      100,
    );

    const newCollateralFactorsBn = batchedData.map(t => t[0]);

    const oraclePricesData = await throttledPromises(
      (block: number) => {
        const cfIndex = allUniqueBlocksToCheck.indexOf(block);
        return getMulticallOutput(
          [{
            contract: oracleContract,
            functionName: 'viewPrice',
            params: [_market.collateral, newCollateralFactorsBn[cfIndex]],
            // inv feed was invalid before borrowing was enabled
            forceFallback: !!_market.oracleStartingBlock && block < _market.oracleStartingBlock,
            fallbackValue: BigNumber.from(0),
          }],
          Number(CHAIN_ID),
          block,
        );
      },
      allUniqueBlocksToCheck,
      5,
      100,
    );

    const newOraclePrices = oraclePricesData.flat().map(p => getBnToNumber(p, (36 - _market.underlying.decimals)));
    const resultTimestamps = archived.timestamps.concat(allUniqueBlocksToCheck.map(b => timestamps[CHAIN_ID][b] * 1000));

    const resultData = {
      timestamp: Date.now(),
      oraclePrices: archived.oraclePrices.concat(newOraclePrices),
      blocks: archived?.blocks.concat(allUniqueBlocksToCheck),
      collateralFactors: archived?.collateralFactors.concat(newCollateralFactorsBn.map(bn => getBnToNumber(bn, 4))),
      timestamps: resultTimestamps,
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