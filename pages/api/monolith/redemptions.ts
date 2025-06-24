import { Contract } from 'ethers'
import 'source-map-support'
import { getPaidProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { isAddress } from 'ethers/lib/utils';
import { estimateBlockTimestamp } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';

export default async function handler(req, res) {
  const { account, chainId, lender } = req.query;
  if(!!lender && !isAddress(lender)) {
    return res.status(400).json({ success: false, error: 'Invalid account address' });
  }
  const cacheKey = account ? `monolith-redemptions-${account}-${chainId}` : `monolith-redemptions-${chainId}`;  
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
    res.setHeader('Access-Control-Allow-Origin', `*`);
    res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getPaidProvider(Number(chainId || 1));

    const lenderContract = new Contract(lender, ["function collateral() view returns (address)",{"type":"event","name":"Redeemed","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"amountIn","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"amountOut","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false}], provider);
    const lastBlock = cachedData?.events?.length ? cachedData?.events[cachedData.events.length-1].blockNumber : undefined;
    
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
        lenderContract.filters.Redeemed(account || undefined),
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
        events = await lenderContract.queryFilter(lenderContract.filters.Redeemed(account || undefined), lastBlock ? lastBlock+1 : undefined, currentBlock);
      }
    } catch (e) {
      console.log('e', e);
      if(!!account){
        isLimited = true;
        console.log('fetching with large log function');
        events = await getLargeLogsFunction();
      }
    }

    events = events.slice(-100);

    const cachedEvents = cachedData?.events || [];

    const newEvents = events.map(e => {
      const amountIn = getBnToNumber(e.args?.amountIn, 18);
      const amountOut = getBnToNumber(e.args?.amountOut, decimals);
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(e.blockNumber, now, currentBlock),
        account: e.args?.account,
        amountIn,
        amountOut,
      }
    });

    const resultData = {
      timestamp: now,
      isLimited,
      events: cachedEvents.concat(newEvents).slice(-100),
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