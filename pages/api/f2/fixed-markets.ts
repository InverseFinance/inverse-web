import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI, F2_CONTROLLER_ABI, F2_MARKET_ABI, F2_ORACLE_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { TOKENS } from '@app/variables/tokens'
import { getBnToNumber } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';

const { F2_MARKETS, DOLA } = getNetworkConfigConstants();
export const F2_MARKETS_CACHE_KEY = `f2markets-v1.0.8`;

export default async function handler(req, res) {

  try {
    const validCache = await getCacheFromRedis(F2_MARKETS_CACHE_KEY, true, 30);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const dolaContract = new Contract(DOLA, DOLA_ABI, provider);

    const [
      bnCollateralFactors,
      bnTotalDebts,
      oracles,
      bnDola,
      replenishmentIncentives,
      liquidationIncentives,
      borrowControllers,
      borrowPaused,
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
    const dayIndexUtc = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0) / 86400000);

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
      return bc === BURN_ADDRESS ? bnDola : dailyLimits[i].sub(dailyBorrows[i]);
    });

    const bnPrices = await Promise.all(
      oracles.map((o, i) => {
        const oracle = new Contract(o, F2_ORACLE_ABI, provider);
        return oracle.viewPrice(F2_MARKETS[i].collateral, bnCollateralFactors[i]);
      }),
    );

    const markets = F2_MARKETS.map((m, i) => {
      const underlying = TOKENS[m.collateral];
      return {
        ...m,
        bnTotalDebts,
        oracle: oracles[i],
        underlying: TOKENS[m.collateral],
        price: getBnToNumber(bnPrices[i], (36 - underlying.decimals)),
        totalDebt: getBnToNumber(bnTotalDebts[i]),
        collateralFactor: getBnToNumber(bnCollateralFactors[i], 4),
        dolaLiquidity: getBnToNumber(bnDola[i]),
        bnDolaLiquidity: bnDola[i],
        replenishmentIncentive: getBnToNumber(replenishmentIncentives[i], 4),
        liquidationIncentive: getBnToNumber(liquidationIncentives[i], 4),
        borrowController: borrowControllers[i],
        borrowPaused: borrowPaused[i],
        dailyLimit: getBnToNumber(dailyLimits[i]),
        dailyBorrows: getBnToNumber(dailyBorrows[i]),
        leftToBorrow: Math.min(getBnToNumber(bnLeftToBorrow[i]), getBnToNumber(bnDola[i])),
        supplyApy: 0,
      }
    })

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