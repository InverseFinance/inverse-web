import { Contract } from 'ethers'
import 'source-map-support'
import { getPaidProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { isAddress } from 'ethers/lib/utils';
import { ascendingEventsSorter, estimateBlockTimestamp } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';
import { BURN_ADDRESS } from '@app/config/constants';
import { LENDER_ABI, monolithSupportedChainIds } from './positions';

export default async function handler(req, res) {
  const cacheDuration = 60;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);
  
  const { account, chainId, lender } = req.query;
  if(!monolithSupportedChainIds.includes(chainId) || !lender || lender === BURN_ADDRESS || (!!lender && !isAddress(lender)) || (!!account && !isAddress(account))) {
    return res.status(400).json({ success: false, error: 'Invalid account address' });
  }
  const cacheKey = account ? `monolith-activity-${lender}-${account}-${chainId}-v1.0.1` : `monolith-activity-${lender}-${chainId}-v1.0.1`;  
  try {

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getPaidProvider(Number(chainId || 1));

    const lenderContract = new Contract(lender, LENDER_ABI, provider);
    const lastBlock = cachedData?.last1000Events?.length ? cachedData?.last1000Events[cachedData.last1000Events.length-1].blockNumber : undefined;

    const [currentBlock, collateralAddress] = await Promise.all([
      provider.getBlockNumber(),
      lenderContract.collateral(),
    ]);

    const collateralContract = new Contract(collateralAddress, ["function decimals() view returns (uint8)"], provider);
    const decimals = await collateralContract.decimals();

    const now = Date.now();

    const getLargeLogsFunction = (contractFilter: any) => {
      return getLargeLogs(
        lenderContract,
        contractFilter,
        lastBlock ? lastBlock+1 : currentBlock - 50_000,
        currentBlock,
        10_000,
      );
    }

    const getFilterData = async (contractFilter: any) => {
      let events: any[] = [];
      try {
        if(!account) {
          events = await getLargeLogsFunction(contractFilter);
        } else {
          events = await lenderContract.queryFilter(contractFilter, lastBlock ? lastBlock+1 : undefined, currentBlock);
        }
      } catch (e) {
        console.log('e', e);
        if(!!account){
          console.log('fetching with large log function');
          events = await getLargeLogsFunction(contractFilter);
        }
      }
      return events;
    }

    const filters = [
      lenderContract.filters.PositionAdjusted(account || undefined),
      lenderContract.filters.RedemptionStatusUpdated(account || undefined),
      lenderContract.filters.Liquidated(account || undefined),
      lenderContract.filters.WrittenOff(account || undefined),
      lenderContract.filters.Redeemed(),
    ];

    const events = (await Promise.all(filters.map(getFilterData))).flat().sort(ascendingEventsSorter);

    const cachedEvents = cachedData?.last1000Events || [];

    const newEvents = events.map(e => {
      const isPositionAdjusted = e.event === 'PositionAdjusted';
      const isRedemptionStatusUpdated = e.event === 'RedemptionStatusUpdated';
      const isLiquidated = e.event === 'Liquidated';
      const isWrittenOff = e.event === 'WrittenOff';
      const isRedeemed = e.event === 'Redeemed';

      let extraData = {};
      if(isPositionAdjusted) {
        extraData = {
          collateralDelta: getBnToNumber(e.args?.collateralDelta, decimals),
          debtDelta: getBnToNumber(e.args?.debtDelta, 18),
        }
      } else if(isRedemptionStatusUpdated) {
        extraData = {
          isRedeemable: e.args?.isRedeemable,
        }
      } else if(isLiquidated) {
        extraData = {
          by: e.args?.liquidator,
          debtDelta: getBnToNumber(e.args?.repayAmount, 18),
          collateralDelta: getBnToNumber(e.args?.collateralOut, decimals),
        }
      } else if(isWrittenOff) {
        extraData = {
          by: e.args?.to,
          debtDelta: getBnToNumber(e.args?.debt, 18),
          collateralDelta: getBnToNumber(e.args?.collateral, decimals),
        }
      } else if(isRedeemed) {
        extraData = {
          by: e.args?.account,
          debtDelta: getBnToNumber(e.args?.amountIn, 18),
          collateralDelta: getBnToNumber(e.args?.amountOut, decimals),
        }
      }

      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(e.blockNumber, now, currentBlock),
        event: e.event,
        account: e.args?.account || e.args?.borrower,
        ...extraData,
      }
    });

    const resultData = {
      timestamp: now,
      last1000Events: cachedEvents.concat(newEvents).slice(-1000),
    }

    await redisSetWithTimestamp(cacheKey, resultData, false);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false, 0, false);
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