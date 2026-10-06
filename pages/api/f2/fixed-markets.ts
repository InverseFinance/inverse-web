import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { TOKENS } from '@app/variables/tokens'
import { getBnToNumber, getConvexMarketsExtraApys, getFirmMarketsApys } from '@app/util/markets'
import { CHAIN_ID, ONE_DAY_MS } from '@app/config/constants';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { formatDistributorData, formatMarketData, inverseViewerRaw } from '@app/util/viewer';
import { BaseProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers';
import { marketsDisplaysCacheKey } from './markets-display';
import { calculateMaxLeverage, estimateBlockTimestamp } from '@app/util/misc';
import { Contract } from 'ethers';
import { ERC20_ABI } from '@app/config/abis';
import { calculateNetApy, getDbrPriceOnCurve, getDolaUsdPriceOnCurve } from '@app/util/f2';
import { getMerklFirmOpportunities, getMerklMarketIncentives } from '@app/util/merkl';
import { F2Market } from '@app/types';

const { F2_MARKETS, F2_ALE } = getNetworkConfigConstants();

export const F2_MARKETS_CACHE_KEY = `f2markets-v1.8.1`;

// same source as /api/dbr, null if unavailable so that the markets data does not depend on it
const getDbrPriceUsd = async (provider: BaseProvider) => {
  try {
    const [{ priceInDola }, { price: dolaPriceUsd }] = await Promise.all([
      getDbrPriceOnCurve(provider as Web3Provider),
      getDolaUsdPriceOnCurve(provider as Web3Provider),
    ]);
    const priceUsd = priceInDola * dolaPriceUsd;
    return priceUsd > 0 ? priceUsd : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

const POINTS_EXPIRIES: { [address: string]: number } = Object.fromEntries(
  F2_MARKETS
    .filter((m: F2Market) => !!m.pointsExpiryTimestamp)
    .map((m: F2Market) => [m.address.toLowerCase(), m.pointsExpiryTimestamp]),
);

// ended points programs show 0 points, applied when serving so that it's also the case for cached data
const withExpiredPoints = (data: any) => {
  if (!Array.isArray(data?.markets)) {
    return data;
  }
  const now = Date.now();
  return {
    ...data,
    markets: data.markets.map((m: F2Market) => now >= POINTS_EXPIRIES[(m.address || '').toLowerCase()] ? { ...m, points: 0 } : m),
  };
}

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

  const cacheKey = vnetPublicId ? `f2markets-sim-${vnetPublicId}` : F2_MARKETS_CACHE_KEY;

  try {
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (cachedData && isValid) {
      res.status(200).json(withExpiredPoints(cachedData));
      return
    }

    let provider;
    if (vnetPublicId) {
      // const cachedSims = (await getCacheFromRedis(SIMS_CACHE_KEY, false));
      // const { ids } =  cachedSims || { ids: [] };
      // const vnet = ids.find(id => id.publicId === vnetPublicId);
      // if(!vnet) {
      //   res.status(404).json({ success: false, error: 'Vnet not found' });
      //   return;
      // }
      // provider = new JsonRpcProvider(vnet.adminRpc);
      provider = new JsonRpcProvider(`https://virtual.mainnet.rpc.tenderly.co/${vnetPublicId}`);
    } else {
      provider = getProvider(CHAIN_ID);
    }

    // trigger
    fetch('https://www.inverse.finance/api/markets');

    const ifvr = inverseViewerRaw(provider);

    const [
      marketData,
      invAprData,
      dbrDistributorData,
      aleAllowancesChecks,
    ] = await getGroupedMulticallOutputs([
      { contract: ifvr.firmContract, functionName: 'getMarketListData', params: [F2_MARKETS.map(m => m.hasNowInvalidFeed ? '0x0000000000000000000000000000000000000000' : m.address)] },
      { contract: ifvr.tokensContract, functionName: 'getInvApr', params: [] },
      { contract: ifvr.tokensContract, functionName: 'getDbrDistributorInfo', params: [] },
      F2_MARKETS.map(m => {
        return { contract: new Contract(m.collateral, ERC20_ABI, provider), functionName: 'allowance', params: [F2_ALE, m.address] }
      })
    ], 1, undefined, provider);

    const [formattedMarketData, invApr, formattedDistrubutorData] = [
      marketData.map(formatMarketData),
      getBnToNumber(invAprData),
      formatDistributorData(dbrDistributorData),
    ];

    const [externalApys, convexExtraApys, marketsDisplay, currentBlock, dbrPriceUsd, merklOpportunities] = await Promise.all([
      getFirmMarketsApys(provider, invApr, cachedData),
      getConvexMarketsExtraApys(),
      getCacheFromRedis(marketsDisplaysCacheKey, false),
      provider.getBlockNumber(),
      getDbrPriceUsd(provider),
      getMerklFirmOpportunities(),
    ])
    const { cvxCrvData, cvxFxsData } = externalApys;

    const dbrApr = formattedDistrubutorData.dbrApr;
    // fixed borrow rate of all markets in %: borrowing 1 DOLA for 1 year costs 1 DBR
    const fixedBorrowApy = dbrPriceUsd ? dbrPriceUsd * 100 : null;

    const { suspendAllDeposits, suspendAllLeverage, suspendAllBorrows } = (marketsDisplay || {});

    const now = Date.now();

    const markets = F2_MARKETS.map((m, i) => {
      const underlying = TOKENS[m.collateral];
      const isCvxCrv = underlying.symbol === 'cvxCRV';
      const isCvxFxs = underlying.symbol === 'cvxFXS';
      const marketData = formattedMarketData.find(fm => fm.market.toLowerCase() === m.address.toLowerCase());
      const marketCustomDisplay = marketsDisplay ? marketsDisplay[m.address] : {};
      const isBorrowingSuspended = suspendAllBorrows || marketCustomDisplay?.isBorrowingSuspended || m.isBorrowingSuspended;
      const isLeverageSuspended = suspendAllLeverage || marketCustomDisplay?.isLeverageSuspended || m.isLeverageSuspended;
      const isPendle = m.name.startsWith('PT-');
      const supplyApy = externalApys[underlying.symbol] || externalApys[m.name] || 0;
      const isPendleMatured = isPendle && !supplyApy;
      const extraRewardApy = convexExtraApys.find(c => c.name.toLowerCase() === m.name.toLowerCase())?.extraApy || 0;
      const marketOverrides = m.hasNowInvalidFeed ? { ...marketData, price: 0, totalDebt: 0, ...m} : {...m,...marketData}
      const extraApy = m.isInv ? dbrApr : 0;
      const collateralFactor = marketOverrides.collateralFactor;
      const maxLeverage = collateralFactor >= 0 && collateralFactor < 1 ? calculateMaxLeverage(collateralFactor) : null;
      // Merkl api unavailable: keep the last known incentives
      const cachedMarket = cachedData?.markets?.find((cm: F2Market) => cm.address === m.address);
      const { hasMerklRewards, merklApy, merklBorrowApr, merklCampaignEndTimestamp, merklRewardTokens } = merklOpportunities ?
        getMerklMarketIncentives(m.address, merklOpportunities) :
        {
          hasMerklRewards: !!cachedMarket?.hasMerklRewards,
          merklApy: cachedMarket?.merklApy || 0,
          merklBorrowApr: cachedMarket?.merklBorrowApr || 0,
          merklCampaignEndTimestamp: cachedMarket?.merklCampaignEndTimestamp || null,
          merklRewardTokens: cachedMarket?.merklRewardTokens || [],
        };
      return {
        ...marketOverrides,
        extraRewardApy,
        // Merkl rewards are separate from the supplyApy
        merklApy,
        merklBorrowApr,
        hasMerklRewards,
        merklCampaignEndTimestamp,
        merklRewardTokens,
        aleAllowance: getBnToNumber(aleAllowancesChecks[i]) > 0 ? 'OK' : 'KO',
        underlying: TOKENS[m.collateral],
        supplyApy: supplyApy + extraRewardApy,
        extraApy,
        // theoretical max leverage: borrow limit at 100% and DOLA at $1
        maxLeverage,
        // yield at max leverage net of the fixed borrow cost, plus the Merkl rewards on the deposits and the debt
        maxNetApy: maxLeverage !== null && dbrPriceUsd ?
          calculateNetApy(supplyApy + extraRewardApy + merklApy + extraApy, collateralFactor, dbrPriceUsd) + merklBorrowApr * (maxLeverage - 1)
          : null,
        supplyApyLow: isCvxCrv ? Math.min(cvxCrvData?.group1 || 0, cvxCrvData?.group2 || 0) : 0,
        cvxCrvData: isCvxCrv ? cvxCrvData : undefined,
        cvxFxsData: isCvxFxs ? cvxFxsData : undefined,
        invStakedViaDistributor: m.isInv ? formattedDistrubutorData.invStaked : undefined,
        dbrApr: m.isInv ? dbrApr : undefined,
        dbrRewardRate: m.isInv ? formattedDistrubutorData.rewardRate : undefined,
        dbrYearlyRewardRate: m.isInv ? formattedDistrubutorData.yearlyRewardRate : undefined,
        dbrInvExRate: m.isInv ? formattedDistrubutorData.dbrInvExRate : undefined,
        noDeposit: suspendAllDeposits || marketCustomDisplay?.noDeposit || m.noDeposit,
        isPhasingOut: marketCustomDisplay?.isPhasingOut || m.isPhasingOut,
        isLeverageSuspended: isLeverageSuspended,
        isBorrowingSuspended: isBorrowingSuspended,
        isLeverageComingSoon: isLeverageSuspended || m.isLeverageComingSoon,
        phasingOutComment: marketCustomDisplay?.phasingOutComment || m.phasingOutComment || '',
        isPendle,
        isPendleMatured,
        isNewMarket: estimateBlockTimestamp(m.startingBlock, now, currentBlock) >= (now - ONE_DAY_MS * 14),
      }
    });

    const resultData = {
      timestamp: now,
      fixedBorrowApy,
      markets,
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(withExpiredPoints(resultData))
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache && !vnetPublicId) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(withExpiredPoints(cache));
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
