import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DBR_DISTRIBUTOR_ABI, DOLA_ABI, F2_CONTROLLER_ABI, F2_MARKET_ABI, F2_ORACLE_ABI, XINV_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { TOKENS } from '@app/variables/tokens'
import { getBnToNumber, getCvxCrvAPRs, getGOhmData, getStethData } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID, ONE_DAY_MS, ONE_DAY_SECS } from '@app/config/constants';
import { frontierMarketsCacheKey } from '../markets';
import { cgPricesCacheKey } from '../prices';

const { F2_MARKETS, DOLA, XINV, DBR_DISTRIBUTOR } = getNetworkConfigConstants();
export const F2_MARKETS_CACHE_KEY = `f2markets-v1.1.4`;

export default async function handler(req, res) {

  try {
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(F2_MARKETS_CACHE_KEY, true, 60);    
    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const dolaContract = new Contract(DOLA, DOLA_ABI, provider);

    const xINV = new Contract(XINV, XINV_ABI, provider);
    const dbrDistributor = new Contract(DBR_DISTRIBUTOR, DBR_DISTRIBUTOR_ABI, provider);

    // trigger
    fetch('https://inverse.finance/api/markets');

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
      frontierMarkets,
      cgPrices,
    ] = await Promise.all([
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.collateralFactorBps()
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.totalDebt()
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.oracle()
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          return dolaContract.balanceOf(m.address);
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.replenishmentIncentiveBps();
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.liquidationIncentiveBps();
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.borrowController();
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.borrowPaused();
        })
      ),
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.liquidationFactorBps();
        })
      ),
      xINV.exchangeRateStored(),
      dbrDistributor.totalSupply(),
      dbrDistributor.rewardRate(),
      getCacheFromRedis(frontierMarketsCacheKey, false),
      getCacheFromRedis(cgPricesCacheKey, false),
    ]);

    const dailyLimits = await Promise.all(
      borrowControllers.map((bc, i) => {
        if(!bc || bc === BURN_ADDRESS) {
          return new Promise(resolve => resolve(BigNumber.from('0')));
        } else {
          const bcContract = new Contract(bc, F2_CONTROLLER_ABI, provider);
          return bcContract.dailyLimits(F2_MARKETS[i].address);
        }
      })
    );

    const today = new Date();
    const dayIndexUtc = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0) / ONE_DAY_MS);

    const dailyBorrows = await Promise.all(
      borrowControllers.map((bc, i) => {
        if(bc === BURN_ADDRESS) {
          return new Promise(resolve => resolve(BigNumber.from('0')));
        } else {
          const bcContract = new Contract(bc, F2_CONTROLLER_ABI, provider);
          return bcContract.dailyBorrows(F2_MARKETS[i].address, dayIndexUtc);
        }
      })
    );

    const bnLeftToBorrow = borrowControllers.map((bc, i) => {
      return bc === BURN_ADDRESS ? bnDola[i] : dailyLimits[i].sub(dailyBorrows[i]);
    });

    const bnPrices = (await Promise.allSettled(
      oracles.map((o, i) => {
        const oracle = new Contract(o, F2_ORACLE_ABI, provider);
        return oracle.viewPrice(F2_MARKETS[i].collateral, bnCollateralFactors[i]);
      }),
    )).map(r => r.status === 'fulfilled' ? r.value : BigNumber.from('0'));

    const oracleFeeds = (await Promise.all(
      oracles.map((o, i) => {
        const oracle = new Contract(o, F2_ORACLE_ABI, provider);
        return oracle.feeds(F2_MARKETS[i].collateral);
      }),
    ));

    let cvxCrvData = {};
    const { data: cvxCrvAprsCache, isValid: isCvxCrvCacheValid } = await getCacheFromRedisAsObj('cvxCrv-aprs', true, 300);
    if(!cvxCrvAprsCache || !isCvxCrvCacheValid) {
      cvxCrvData = await getCvxCrvAPRs(provider);
      if(!!cvxCrvData?.group1) {
        redisSetWithTimestamp('cvx-crv-aprs', cvxCrvData);
      } else if (!!cvxCrvAprsCache) {
        cvxCrvData = cvxCrvAprsCache;
      }
    } else {
      cvxCrvData = cvxCrvAprsCache
    }
    // external yield bearing apys
    const externalYieldResults = await Promise.allSettled([
      getStethData(),
      getGOhmData(),
    ]);

    const [stethData, gohmData] = externalYieldResults.map(r => {
      return r.status === 'fulfilled' ? r.value : {};
    });

    const invFrontierMarket = frontierMarkets.markets.find(m => m.token === '0x1637e4e9941D55703a7A5E7807d6aDA3f7DCD61B')!;
    const externalApys = {
      'stETH': stethData?.apy||0,
      'gOHM': gohmData?.apy||0,
      'cvxCRV': Math.max(cvxCrvData?.group1||0, cvxCrvData?.group2||0),
      'INV': invFrontierMarket.supplyApy||0,
    };

    const xinvExRate = getBnToNumber(xinvExRateBn);
    const invStakedViaDistributor = xinvExRate * getBnToNumber(dbrDistributorSupply);
    const dbrRewardRate = getBnToNumber(dbrRewardRateBn);
    const dbrYearlyRewardRate = dbrRewardRate * ONE_DAY_SECS * 365;
    const dbrInvExRate = cgPrices['dola-borrowing-right']?.usd / cgPrices['inverse-finance']?.usd;
    const dbrApr = dbrYearlyRewardRate * dbrInvExRate / invStakedViaDistributor * 100;

    const markets = F2_MARKETS.map((m, i) => {
      const underlying = TOKENS[m.collateral];
      const isCvxCrv = underlying.symbol === 'cvxCRV';
      return {
        ...m,        
        oracle: oracles[i],
        oracleFeed: oracleFeeds[i][0],
        underlying: TOKENS[m.collateral],
        price: m.isInv ? cgPrices[underlying.coingeckoId]?.usd : getBnToNumber(bnPrices[i], (36 - underlying.decimals)),
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
        supplyApyLow: isCvxCrv ? Math.min(cvxCrvData?.group1||0, cvxCrvData?.group2||0) : 0,
        cvxCrvData: isCvxCrv ? cvxCrvData : undefined,
        invStakedViaDistributor: m.isInv ? invStakedViaDistributor : undefined,
        dbrApr: m.isInv ? dbrApr : undefined,
        dbrRewardRate: m.isInv ? dbrRewardRate : undefined,
        dbrYearlyRewardRate: m.isInv ? dbrYearlyRewardRate : undefined,
      }
    });

    const resultData = {
      markets,
      timestamp: +(new Date()),
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