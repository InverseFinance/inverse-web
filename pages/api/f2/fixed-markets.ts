import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { TOKENS } from '@app/variables/tokens'
import { getBnToNumber, getFirmMarketsApys } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { formatDistributorData, formatMarketData, inverseViewerRaw } from '@app/util/viewer';
// import { FIRM_MARKETS_SNAPSHOT } from '@app/fixtures/firm-markets-20241022';

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2_MARKETS_CACHE_KEY = `f2markets-v1.3.2`;

export default async function handler(req, res) {
  const cacheDuration = 120;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);

  const { cacheFirst } = req.query;
  try {
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(F2_MARKETS_CACHE_KEY, cacheFirst !== 'true', cacheDuration);
    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(CHAIN_ID);

    // trigger
    fetch('https://inverse.finance/api/markets');

    const ifvr = inverseViewerRaw(provider);
    
    const [
      marketData,
      invAprData,
      dbrDistributorData,
    ] = await getGroupedMulticallOutputs([
      { contract: ifvr.firmContract, functionName: 'getMarketListData', params: [F2_MARKETS.map(m => m.address)] },
      { contract: ifvr.tokensContract, functionName: 'getInvApr', params: [] },
      { contract: ifvr.tokensContract, functionName: 'getDbrDistributorInfo', params: [] },
    ]);

    const [formattedMarketData, invApr, formattedDistrubutorData] = [
      marketData.map(formatMarketData),
      getBnToNumber(invAprData),
      formatDistributorData(dbrDistributorData),
    ];

    const externalApys = await getFirmMarketsApys(provider, invApr, cachedData);
    const { cvxCrvData, cvxFxsData } = externalApys;

    const dbrApr = formattedDistrubutorData.dbrApr;

    const markets = F2_MARKETS.map((m, i) => {
      const underlying = TOKENS[m.collateral];
      const isCvxCrv = underlying.symbol === 'cvxCRV';
      const isCvxFxs = underlying.symbol === 'cvxFXS';
      const marketData = formattedMarketData.find(fm => fm.market.toLowerCase() === m.address.toLowerCase());
      return {
        ...m,      
        ...marketData,
        underlying: TOKENS[m.collateral],
        supplyApy: externalApys[underlying.symbol] || externalApys[m.name] || 0,
        extraApy: m.isInv ? dbrApr : 0,
        supplyApyLow: isCvxCrv ? Math.min(cvxCrvData?.group1 || 0, cvxCrvData?.group2 || 0) : 0,
        cvxCrvData: isCvxCrv ? cvxCrvData : undefined,
        cvxFxsData: isCvxFxs ? cvxFxsData : undefined,
        invStakedViaDistributor: m.isInv ? formattedDistrubutorData.invStaked : undefined,
        dbrApr: m.isInv ? dbrApr : undefined,
        dbrRewardRate: m.isInv ? formattedDistrubutorData.rewardRate : undefined,
        dbrYearlyRewardRate: m.isInv ? formattedDistrubutorData.yearlyRewardRate : undefined,
        dbrInvExRate: m.isInv ? formattedDistrubutorData.dbrInvExRate : undefined,
      }
    });

    const resultData = {
      markets,
      timestamp: Date.now(),
    }

    await redisSetWithTimestamp(F2_MARKETS_CACHE_KEY, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(F2_MARKETS_CACHE_KEY, false);
      if (cache) {
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