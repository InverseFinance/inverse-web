import { Contract } from 'ethers'
import 'source-map-support'
import { getPaidProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { isAddress } from 'ethers/lib/utils';
import { estimateBlockTimestamp } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';
import { LENDER_ABI, monolithSupportedChainIds } from './positions';
import { BURN_ADDRESS } from '@app/config/constants';

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
  const cacheKey = account ? `monolith-writeoffs-${account}-${chainId}-v1.0.1` : `monolith-writeoffs-${chainId}-v1.0.1`;  
  try {
    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getPaidProvider(Number(chainId || 1));

    const lenderContract = new Contract(lender, LENDER_ABI, provider);
    const lastBlock = cachedData?.last100Events?.length ? cachedData?.last100Events[cachedData.last100Events.length-1].blockNumber : undefined;
    
    let events: any[] = [];

    const [currentBlock, collateralAddress] = await Promise.all([
      provider.getBlockNumber(),
      lenderContract.collateral(),
    ]);
    const now = Date.now();
    const collateralContract = new Contract(collateralAddress, ["function decimals() view returns (uint8)"], provider);
    const decimals = await collateralContract.decimals();

    const getLargeLogsFunction = () => {
      return getLargeLogs(
        lenderContract,
        lenderContract.filters.WrittenOff(account || undefined),
        lastBlock ? lastBlock+1 : currentBlock - 50_000,
        currentBlock,
        10_000,
      );
    }

    let isLimited = false;
    try {
      if(!account) {
        events = await getLargeLogsFunction();
      } else {
        events = await lenderContract.queryFilter(lenderContract.filters.WrittenOff(account || undefined), lastBlock ? lastBlock+1 : undefined, currentBlock);
      }
    } catch (e) {
      console.log('e', e);
      if(!!account){
        isLimited = true;
        console.log('fetching with large log function');
        events = await getLargeLogsFunction();
      }
    }

    const cachedEvents = cachedData?.last100Events || [];

    const newEvents = events.map(e => {
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(e.blockNumber, now, currentBlock),
        account: e.args?.borrower,
        by: e.args?.to,
        debtDelta: getBnToNumber(e.args?.debt, 18),
        collateralDelta: getBnToNumber(e.args?.collateral, decimals),
      }
    });

    const resultData = {
      timestamp: now,
      last100Events: cachedEvents.concat(newEvents).slice(-100),
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