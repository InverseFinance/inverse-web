import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI, F2_ORACLE_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { throttledPromises, utcDateStringToTimestamp } from '@app/util/misc';
import { TOKENS } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { getGroupedMulticallOutputs, getMulticallOutput } from '@app/util/multicall';
import { DAILY_UTC_CACHE_KEY } from '../cron-daily-block-timestamp';
import { ARCHIVED_UTC_DATES_BLOCKS } from '@app/fixtures/utc-dates-blocks';
import { inverseViewerRaw } from '@app/util/viewer';

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
  const cacheKey = `firm-oracle-prices-${market}-v2.0.0`;
  
  try {
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: validCache, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (isValid) {
      res.status(200).json(validCache);
      return
    }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider(CHAIN_ID, '', true);   
    const paidProvider = getPaidProvider(1);
    _market.underlying = TOKENS[_market.collateral];

    if (!_market) {
      res.status(404).json({ success: false });
      return;
    }

    const currentBlock = await provider.getBlockNumber();
    const marketContract = new Contract(_market.address, F2_MARKET_ABI, paidProvider);

    const archived = validCache || { blocks: [], timestamps: [], oraclePrices: [], collateralFactors: [] };

    const viewerContractStart = 21055482

    const lastArchivedBlock = archived.blocks.length > 0 ? archived.blocks[archived.blocks.length - 1] : (_market.oracleStartingBlock || _market.startingBlock) - 1;

    const startingBlock = lastArchivedBlock + 1 < currentBlock ? lastArchivedBlock + 1 : currentBlock;

    const oracleContract = new Contract(F2_ORACLE, F2_ORACLE_ABI, provider);

    const { data: archivedTimeData } = await getCacheFromRedisAsObj(DAILY_UTC_CACHE_KEY, false) || { data: ARCHIVED_UTC_DATES_BLOCKS };
    const dateBlockValues = Object.entries(archivedTimeData[CHAIN_ID]).map(([date, block]) => {
      return { date, block: parseInt(block), timestamp: utcDateStringToTimestamp(date) };
    });

    const newDailyBlockValues = dateBlockValues.filter(d => d.block >= startingBlock);
    newDailyBlockValues.sort((a, b) => a.date > b.date ? 1 : -1);

    const newDailyBlocks = newDailyBlockValues.map(d => d.block);
    const newTimestamps = newDailyBlockValues.map(d => d.timestamp);

    // before viewer helper contract: need to get CF before oracle Price, after: simpler call thanks to viewer contract
    const preViewerBlocks = newDailyBlocks.filter(b => b < viewerContractStart);
    const postViewerBlocks = newDailyBlocks.filter(b => b >= viewerContractStart);
    
    const preViewerCfBatchedData = await throttledPromises(
      (block: number) => {
        return getGroupedMulticallOutputs([          
          { contract: marketContract, functionName: 'collateralFactorBps', params: [] },
        ],
          Number(CHAIN_ID),
          block,
        );
      },
      preViewerBlocks,
      5,
      100,
    );

    const newCollateralFactorsBn = preViewerCfBatchedData.map(t => t[0]);

    const preViewerOraclePricesData = await throttledPromises(
      (block: number) => {
        const cfIndex = preViewerBlocks.indexOf(block);
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
      preViewerBlocks,
      5,
      100,
    );

    const ifv = inverseViewerRaw(provider);

    const postViewerOraclePricesData = await throttledPromises(
      (block: number) => {
        return getMulticallOutput(
          [{
            contract: ifv.firmContract,
            functionName: 'getMarketPrice',
            params: [_market.address],
            // inv feed was invalid before borrowing was enabled
            forceFallback: false,
            fallbackValue: BigNumber.from(0),
          }],
          Number(CHAIN_ID),
          block,
        );
      },
      postViewerBlocks,
      5,
      100,
    );

    const preViewerOraclePrices = preViewerOraclePricesData.flat().map(p => getBnToNumber(p, (36 - _market.underlying.decimals)));
    const postViewerOraclePrices = postViewerOraclePricesData.flat().map(p => getBnToNumber(p, (36 - _market.underlying.decimals)));
    const newOraclePrices = preViewerOraclePrices.concat(postViewerOraclePrices);
    const resultTimestamps = archived.timestamps.concat(newTimestamps);

    const resultData = {
      timestamp: Date.now(),
      preViewerBlocks,
      postViewerBlocks,
      oraclePrices: archived.oraclePrices.concat(newOraclePrices),
      blocks: archived?.blocks.concat(newDailyBlocks),
      // collateralFactors: archived?.collateralFactors.concat(newCollateralFactorsBn.map(bn => getBnToNumber(bn, 4))),
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