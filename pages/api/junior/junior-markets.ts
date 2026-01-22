import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID, JUNIOR_MARKETS_ADDRESS } from '@app/config/constants';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from 'ethers';
import { JUNIOR_MARKETS_ABI } from '@app/config/abis';
import { F2_MARKETS_CACHE_KEY } from '../f2/fixed-markets';

export const JUNIOR_MARKETS_CACHE_KEY = `junior-markets-v1.0.0`;

export default async function handler(req, res) {
  const cacheDuration = 300;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

  const { cacheFirst, vnetPublicId } = req.query;
  if (!!vnetPublicId && isInvalidGenericParam(vnetPublicId)) {
    console.log('invalid vnetPublicId');
    res.status(400).json({ status: 'error', message: 'Invalid vnetPublicId' });
    return;
  }
  
  const cacheKey = vnetPublicId ? `junior-markets-sim-${vnetPublicId}` : JUNIOR_MARKETS_CACHE_KEY;

  try {
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return
    }

    const { data: firmData } = await getCacheFromRedis(F2_MARKETS_CACHE_KEY, false, cacheDuration);

    const firmMarkets = firmData?.markets || [];

    let provider;
    if (vnetPublicId) {
      provider = new JsonRpcProvider(`https://virtual.mainnet.rpc.tenderly.co/${vnetPublicId}`);
    } else {
      provider = getProvider(CHAIN_ID);
    }

    const juniorMarketsContract = new Contract(JUNIOR_MARKETS_ADDRESS, JUNIOR_MARKETS_ABI, provider);

    const [newMarkets, marketsRemoved] = await Promise.all([
      juniorMarketsContract.queryFilter(juniorMarketsContract.filters.NewMarket()),
      // can only be removed before activation time
      juniorMarketsContract.queryFilter(juniorMarketsContract.filters.MarketRemoved()),
    ]);

    const now = Date.now();

    const juniorMarkets = firmMarkets.map(m => {
      const address = m.args?.[0];
      const newJuniorMarket = newMarkets.find(nm => nm.args?.[0] === address);
      const isRemoved = marketsRemoved.some(mr => mr.args?.[0] === address);
      const activationTime = getBnToNumber(newJuniorMarket?.args?.[1]) * 1000;
      return {
        ...m,
        isActivating: !!newJuniorMarket && activationTime > now,
        activationTime,
        isActive: !!newJuniorMarket && activationTime <= now && !isRemoved,
        isRemoved,
      }
    }).filter(m => m.isActive || m.isActivating);

    const resultData = {
      timestamp: now,
      juniorMarkets,
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache && !vnetPublicId) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      } else {
        res.status(500).json({ success: false });
        // temporary snapshot fallback
        // res.status(200).json(FIRM_MARKETS_SNAPSHOT);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
      // res.status(200).json(FIRM_MARKETS_SNAPSHOT);
    }
  }
}