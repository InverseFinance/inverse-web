import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DBR_DISTRIBUTOR_ABI, DOLA_ABI, F2_CONTROLLER_ABI, F2_MARKET_ABI, F2_ORACLE_ABI, FIRM_FED_ABI, XINV_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { TOKENS } from '@app/variables/tokens'
import { getBnToNumber, getCvxCrvAPRs, getCvxFxsAPRs, getDSRData, getSFraxData, getSUSDEData, getStCvxData, getStYcrvData, getStYethData, getStethData } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID, ONE_DAY_MS, ONE_DAY_SECS } from '@app/config/constants';
import { frontierMarketsCacheKey } from '../markets';
import { cgPricesCacheKey } from '../prices';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { FEATURE_FLAGS } from '@app/config/features';
import { getDbrPriceOnCurve, getDolaUsdPriceOnCurve } from '@app/util/f2';

const { F2_MARKETS, DOLA, XINV, DBR_DISTRIBUTOR, FEDS } = getNetworkConfigConstants();
export const F2_MARKETS_CACHE_KEY = `f2markets-v1.2.4`;

export default async function handler(req, res) {
  const { cacheFirst } = req.query;
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(F2_MARKETS_CACHE_KEY, cacheFirst !== 'true', cacheDuration);
    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const dolaContract = new Contract(DOLA, DOLA_ABI, provider);

    const xINV = new Contract(XINV, XINV_ABI, provider);
    const dbrDistributor = new Contract(DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI, provider);
    const firmFed = FEDS.find((f) => f.isFirm)!;
    const firmFedContract = new Contract(firmFed.address, FIRM_FED_ABI, provider);

    // trigger
    fetch('https://inverse.finance/api/markets');

    const [
      groupedMulticallData,
      frontierMarkets,
      cgPrices,
      dbrPriceData,
      dolaPriceData,
    ] = await Promise.all([
      getGroupedMulticallOutputs([
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'collateralFactorBps' }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'totalDebt' }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'oracle' }
        }),
        F2_MARKETS.map(m => {
          return { contract: dolaContract, functionName: 'balanceOf', params: [m.address] }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'replenishmentIncentiveBps' }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'liquidationIncentiveBps' }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'borrowController' }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'borrowPaused' }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'liquidationFactorBps' }
        }),
        { contract: xINV, functionName: 'exchangeRateStored' },
        { contract: dbrDistributor, functionName: 'totalSupply' },
        { contract: dbrDistributor, functionName: 'rewardRate' },
        F2_MARKETS.map(m => {          
          return { contract: firmFedContract, functionName: 'ceilings', params: [m.address] }
        }),
      ]),
      getCacheFromRedis(frontierMarketsCacheKey, false),
      getCacheFromRedis(cgPricesCacheKey, false),
      getDbrPriceOnCurve(provider),
      getDolaUsdPriceOnCurve(provider),
    ]);

    const [
      bnCollateralFactors,
      bnTotalDebts,
      oracles,
      bnDola,
      replenishmentIncentives,
      liquidationIncentives,
      borrowControllers,
      borrowPaused,
      liquidationFactors,
      xinvExRateBn,
      dbrDistributorSupply,
      dbrRewardRateBn,
      ceilings,
     ] = groupedMulticallData;

    const today = new Date();
    const dayIndexUtc = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0) / ONE_DAY_MS);
    
    const [dailyLimits, dailyBorrows, minDebtsBn, bnPrices, oracleFeeds] = await getGroupedMulticallOutputs([
      borrowControllers.map((bc, i) => {
        const bcContract = new Contract(bc, F2_CONTROLLER_ABI, provider);
        return { contract: bcContract, functionName: 'dailyLimits', params: [F2_MARKETS[i].address], forceFallback: bc === BURN_ADDRESS || !bc, fallbackValue: BigNumber.from('0') }
      }),
      borrowControllers.map((bc, i) => {
        const bcContract = new Contract(bc, F2_CONTROLLER_ABI, provider);
        return { contract: bcContract, functionName: 'dailyBorrows', params: [F2_MARKETS[i].address, dayIndexUtc], forceFallback: bc === BURN_ADDRESS || !bc, fallbackValue: BigNumber.from('0') }
      }),      
      borrowControllers.map((bc, i) => {
        const bcContract = new Contract(bc, F2_CONTROLLER_ABI, provider);
        return { contract: bcContract, functionName: 'minDebts', params: [F2_MARKETS[i].address], forceFallback: bc === BURN_ADDRESS || !FEATURE_FLAGS.firmMinDebt || !bc, fallbackValue: BigNumber.from('0') }
      }),
      oracles.map((o, i) => {
        const oracle = new Contract(o, F2_ORACLE_ABI, provider);
        return { contract: oracle, functionName: 'viewPrice', params: [F2_MARKETS[i].collateral, bnCollateralFactors[i]], forceFallback: !o, fallbackValue: BigNumber.from('0') }
      }),
      oracles.map((o, i) => {
        const oracle = new Contract(o, F2_ORACLE_ABI, provider);
        return { contract: oracle, functionName: 'feeds', params: [F2_MARKETS[i].collateral], forceFallback: !o, fallbackValue: BURN_ADDRESS }
      }),
    ]);

    const bnLeftToBorrow = borrowControllers.map((bc, i) => {
      return bc === BURN_ADDRESS ? bnDola[i] : dailyLimits[i].sub(dailyBorrows[i]);
    });

    // external yield bearing apys
    const externalYieldResults = await Promise.allSettled([
      getStethData(),
      getStYcrvData(),
      getCvxCrvAPRs(provider),
      getCvxFxsAPRs(provider),
      getDSRData(),
      getStCvxData(),
      getStYethData(),
      getSFraxData(provider),
      getSUSDEData(),
    ]);

    let [stethData, stYcrvData, cvxCrvData, cvxFxsData, dsrData, stCvxData, stYethData, sFraxData, sUSDEData] = externalYieldResults.map(r => {
      return r.status === 'fulfilled' ? r.value : {};
    });

    if (!cvxCrvData.group1 && !!cachedData) {
      cvxCrvData = cachedData.markets.find(m => m.name === 'cvxCRV').cvxCrvData;
    }

    if (!cvxFxsData.fxs && !!cachedData) {
      cvxFxsData = cachedData.markets.find(m => m.name === 'cvxFXS').cvxFxsData;
    }

    const invFrontierMarket = frontierMarkets.markets.find(m => m.token === '0x1637e4e9941D55703a7A5E7807d6aDA3f7DCD61B')!;
    const externalApys = {
      'stETH': stethData?.apy || 0,
      'wstETH': stethData?.apy || 0,
      'cvxCRV': Math.max(cvxCrvData?.group1 || 0, cvxCrvData?.group2 || 0),
      'cvxFXS': (cvxFxsData?.fxs || 0) + (cvxFxsData?.cvx || 0),
      'INV': invFrontierMarket.supplyApy || 0,
      'st-yCRV': stYcrvData?.apy || 0,
      'DAI': dsrData?.apy || 0,
      'CVX': stCvxData?.apy || 0,
      'st-yETH': stYethData?.apy || 0,
      'sFRAX': sFraxData?.apy || 0,
      'sUSDE': sUSDEData?.apy || 0,
    };

    const xinvExRate = getBnToNumber(xinvExRateBn);
    const invStakedViaDistributor = xinvExRate * getBnToNumber(dbrDistributorSupply);
    const dbrRewardRate = getBnToNumber(dbrRewardRateBn);
    const dbrYearlyRewardRate = dbrRewardRate * ONE_DAY_SECS * 365;
    const dbrInvExRate = (dbrPriceData.priceInDola * dolaPriceData.price||1) / cgPrices['inverse-finance']?.usd;
    const dbrApr = dbrYearlyRewardRate * dbrInvExRate / invStakedViaDistributor * 100;

    const markets = F2_MARKETS.map((m, i) => {
      const underlying = TOKENS[m.collateral];
      const isCvxCrv = underlying.symbol === 'cvxCRV';
      const isCvxFxs = underlying.symbol === 'cvxFXS';
      return {
        ...m,
        oracle: oracles[i],
        oracleFeed: oracleFeeds[i][0],
        underlying: TOKENS[m.collateral],
        price: getBnToNumber(bnPrices[i], (36 - underlying.decimals)),
        totalDebt: getBnToNumber(bnTotalDebts[i]),
        collateralFactor: getBnToNumber(bnCollateralFactors[i], 4),
        dolaLiquidity: getBnToNumber(bnDola[i]),
        bnDolaLiquidity: bnDola[i],
        replenishmentIncentive: getBnToNumber(replenishmentIncentives[i], 4),
        liquidationIncentive: getBnToNumber(liquidationIncentives[i], 4),
        liquidationFactor: getBnToNumber(liquidationFactors[i], 4),
        borrowController: borrowControllers[i],
        borrowPaused: borrowPaused[i],
        dailyLimit: getBnToNumber(dailyLimits[i]),
        dailyBorrows: getBnToNumber(dailyBorrows[i]),
        leftToBorrow: Math.min(getBnToNumber(bnLeftToBorrow[i]), getBnToNumber(bnDola[i])),
        supplyApy: externalApys[underlying.symbol] || 0,
        extraApy: m.isInv ? dbrApr : 0,
        supplyApyLow: isCvxCrv ? Math.min(cvxCrvData?.group1 || 0, cvxCrvData?.group2 || 0) : 0,
        cvxCrvData: isCvxCrv ? cvxCrvData : undefined,
        cvxFxsData: isCvxFxs ? cvxFxsData : undefined,
        invStakedViaDistributor: m.isInv ? invStakedViaDistributor : undefined,
        dbrApr: m.isInv ? dbrApr : undefined,
        dbrRewardRate: m.isInv ? dbrRewardRate : undefined,
        dbrYearlyRewardRate: m.isInv ? dbrYearlyRewardRate : undefined,
        minDebt: getBnToNumber(minDebtsBn[i]),
        ceiling: getBnToNumber(ceilings[i]),
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
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}