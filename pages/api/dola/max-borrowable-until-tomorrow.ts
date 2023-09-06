import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DOLA_ABI, F2_CONTROLLER_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID, ONE_DAY_MS } from '@app/config/constants';
import { getGroupedMulticallOutputs } from '@app/util/multicall';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `${CHAIN_ID}-dola-max-borrowable-until-tomorrow-v1.0.0`;

  try {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const dolaContract = new Contract(process.env.NEXT_PUBLIC_DOLA!, DOLA_ABI, provider);

    const [
      groupedMulticallData,
    ] = await Promise.all([
      getGroupedMulticallOutputs([
        F2_MARKETS.map(m => {
          return { contract: dolaContract, functionName: 'balanceOf', params: [m.address] }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'borrowController' }
        }),
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return { contract: market, functionName: 'borrowPaused' }
        }),
      ]),
    ]);

    const [
      bnDola,
      borrowControllers,
      borrowPaused,
    ] = groupedMulticallData;

    const today = new Date();
    const dayIndexUtc = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0) / ONE_DAY_MS);

    const [dailyLimits, dailyBorrows] = await getGroupedMulticallOutputs([
      borrowControllers.map((bc, i) => {
        const bcContract = new Contract(bc, F2_CONTROLLER_ABI, provider);
        return { contract: bcContract, functionName: 'dailyLimits', params: [F2_MARKETS[i].address], forceFallback: bc === BURN_ADDRESS, fallbackValue: BigNumber.from('0') }
      }),
      borrowControllers.map((bc, i) => {
        const bcContract = new Contract(bc, F2_CONTROLLER_ABI, provider);
        return { contract: bcContract, functionName: 'dailyBorrows', params: [F2_MARKETS[i].address, dayIndexUtc], forceFallback: bc === BURN_ADDRESS, fallbackValue: BigNumber.from('0') }
      }),
    ]);

    const bnLeftToBorrow = borrowControllers.map((bc, i) => {
      return bc === BURN_ADDRESS ? bnDola[i] : dailyLimits[i].sub(dailyBorrows[i]);
    });

    const markets = F2_MARKETS.map((m, i) => {
      return {
        dolaLiquidity: getBnToNumber(bnDola[i]),
        borrowPaused: borrowPaused[i],
        dailyLimit: getBnToNumber(dailyLimits[i]),
        leftToBorrow: Math.min(getBnToNumber(bnLeftToBorrow[i]), getBnToNumber(bnDola[i])),
      }
    });

    const maxBorrowableUntilTomorrow = markets
      .filter((m, i) => !m.borrowPaused)
      .map((market) => {
        return {          
          maxBorrowableUntilTomorrow: Math.min(market.leftToBorrow + market.dailyLimit, market.dolaLiquidity),
        }
      }).reduce((prev, curr) => {
        return prev + curr.maxBorrowableUntilTomorrow;
      }, 0)

    await redisSetWithTimestamp(cacheKey, maxBorrowableUntilTomorrow);

    res.status(200).send(maxBorrowableUntilTomorrow);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch (e) {
      console.error(e);
      res.status(500);
    }
  }
}