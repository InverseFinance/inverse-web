import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { TOKENS } from '@app/variables/tokens'
import { getBnToNumber, getFirmMarketsApys } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { formatDistributorData, formatMarketData, inverseViewerRaw } from '@app/util/viewer';
import { SIMS_CACHE_KEY } from '../drafts/sim';
import { JsonRpcProvider } from '@ethersproject/providers';
// import { FIRM_MARKETS_SNAPSHOT } from '@app/fixtures/firm-markets-20241022';

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2_MARKETS_CACHE_KEY = `f2markets-v1.4.2`;

export default async function handler(req, res) {
  const cacheDuration = 90;
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
  
  const cacheKey = vnetPublicId ? `f2markets-sim-${vnetPublicId}` : F2_MARKETS_CACHE_KEY;
  try {
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return
    }

    let provider;
    if (vnetPublicId) {
      const cachedSims = (await getCacheFromRedis(SIMS_CACHE_KEY, false));    
      const { ids } =  cachedSims || { ids: [] };
      const vnet = ids.find(id => id.publicId === vnetPublicId);
      if(!vnet) {
        res.status(404).json({ success: false, error: 'Vnet not found' });
        return;
      }
      provider = new JsonRpcProvider(vnet.adminRpc);
    } else {
      provider = getProvider(CHAIN_ID);
    }

    // trigger
    // fetch('https://inverse.finance/api/markets');

    const ifvr = inverseViewerRaw(provider);
    
    const [
      marketData,
      invAprData,
      dbrDistributorData,
    ] = await getGroupedMulticallOutputs([
      { contract: ifvr.firmContract, functionName: 'getMarketListData', params: [F2_MARKETS.map(m => m.address)] },
      { contract: ifvr.tokensContract, functionName: 'getInvApr', params: [] },
      { contract: ifvr.tokensContract, functionName: 'getDbrDistributorInfo', params: [] },
    ], 1, undefined, provider);

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