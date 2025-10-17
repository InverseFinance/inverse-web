import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Prices, Token } from '@app/types'
import { CHAIN_TOKENS } from '@app/variables/tokens'
import { getLPPrice } from '@app/util/contracts'
import { getProvider } from '@app/util/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import { COMPTROLLER_ABI, ORACLE_ABI, SVAULT_ABI } from '@app/config/abis'
import { BigNumber, Contract } from 'ethers'
import { formatUnits } from '@ethersproject/units'
import { getTokenData } from '@app/util/livecoinwatch'
import { getChainlinkDolaUsdPrice } from '@app/util/f2'
import { dolaStakingCacheKey } from './dola-staking'
import { getBnToNumber } from '@app/util/markets'

export const pricesCacheKey = `prices-v1.0.91`;
export const cgPricesCacheKey = `cg-prices-v1.0.0`;

export default async function handler(req, res) {
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(pricesCacheKey, true, cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const prices = {};
    let coingeckoIds: string[] = [];

    const {
      UNDERLYING,
      ORACLE,
      COMPTROLLER,
    } = getNetworkConfigConstants(NetworkIds.mainnet);

    const provider = getProvider(process.env.NEXT_PUBLIC_CHAIN_ID!);

    const oracle = new Contract(ORACLE, ORACLE_ABI, provider);
    const comptroller = new Contract(COMPTROLLER, COMPTROLLER_ABI, provider);
    const allMarkets: string[] = [...await comptroller.getAllMarkets()];

    const markets = allMarkets
      .filter(address => !!UNDERLYING[address]
        // && !UNDERLYING[address].coingeckoId
        // && !UNDERLYING[address].isLP
        // && !UNDERLYING[address].isCrvLP
        // && !UNDERLYING[address]?.pairs?.length
      );

    const oraclePrices = await Promise.all([
      ...markets.map(address => oracle.getUnderlyingPrice(address))
    ]);

    oraclePrices
      .forEach((v, i) => {
        const underlying = UNDERLYING[markets[i]];
        const price = parseFloat(formatUnits(v, BigNumber.from(36).sub(underlying.decimals)));
        prices[underlying.symbol] = price;
      });

    const exceptions = ['0x20BB4a325924917E3336753BA5350a84F70f392e'].map(a => a.toLowerCase());
    Object.values(CHAIN_TOKENS)
      .forEach(tokenList => {
        Object.values(tokenList)
          .filter(t => !!t.coingeckoId && !exceptions.includes(t.address.toLowerCase()))
          .forEach(t => coingeckoIds.push(t.coingeckoId!))
      })

    const uniqueCgIds = [...new Set(coingeckoIds)];
    let geckoPrices: Prices["prices"] = {};
    try {
      const res = await fetch(`https://pro-api.coingecko.com/api/v3/simple/price?x_cg_pro_api_key=${process.env.CG_PRO}&vs_currencies=usd&ids=${uniqueCgIds.join(',')}`);
      geckoPrices = await res.json();

      const cgOk = !!geckoPrices?.['inverse-finance']?.usd;
      if (cgOk) {
        await redisSetWithTimestamp(cgPricesCacheKey, geckoPrices);
      } else {
        geckoPrices = (await getCacheFromRedis(cgPricesCacheKey, false)) || {};
      }
    } catch (e) {
      console.log('Error fetching gecko prices');
      geckoPrices = (await getCacheFromRedis(cgPricesCacheKey, false)) || {};
    }
    
    try {
      prices['dola-usd-cg'] = geckoPrices['dola-usd']?.usd;
      const dolaData = await getTokenData('DOLA');
      if (dolaData?.rate) {
        prices['dola-usd-lcw'] = dolaData.rate;
      }
    } catch (e) {
      console.log('Error livecoinwatch gecko prices');
    }
    
    Object.entries(geckoPrices).forEach(([key, value]) => {
      prices[key] = value.usd;
    });

    const sUSDSContract = new Contract('0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD', SVAULT_ABI, provider);

    const [dolaUsdCurveData, dolaStakingData, sUSDSExRateBn] = await Promise.all([
      getChainlinkDolaUsdPrice(getProvider(NetworkIds.mainnet)),
      getCacheFromRedis(dolaStakingCacheKey, false),
      sUSDSContract.convertToAssets('1000000000000000000'),
    ]);

    const { price: chainlinkDolaUsdPrice } = dolaUsdCurveData;
    const { sDolaExRate } = dolaStakingData;
    prices['dola-onchain-usd'] = chainlinkDolaUsdPrice;
    prices['dola-usd'] = chainlinkDolaUsdPrice;

    let lps: { token: Token, chainId: string }[] = [];

    Object.entries(CHAIN_TOKENS)
      .filter(([chainId]) => chainId === '1')
      .forEach(([chainId, tokenList]) => {
        Object.values(tokenList)
          .filter(t => (t.pairs?.length > 0 || t.lpPrice || t.isCrvLP || t.convexInfos) && !exceptions.includes(t.address.toLowerCase()))
          .forEach(t => {
            lps.push({ token: t, chainId });
          })
      })
   
    const lpDataResults = await Promise.allSettled([
      ...lps.map(lp => {
        return getLPPrice(lp.token, lp.chainId, getProvider(lp.chainId), geckoPrices);
      })
    ]);
    const lpData = lpDataResults.map(r => r.status === 'fulfilled' ? r.value : null);

    lps.forEach((lpToken, i) => {
      if (lpData[i]) {
        prices[lpToken.token.symbol] = lpData[i];
      }
    });

    prices['staked-dola'] = prices['dola-usd'] * sDolaExRate;
    prices['SDOLA'] = prices['staked-dola'];
    prices['sDOLA'] = prices['staked-dola'];
    prices['sUSDS'] = (prices['usds'] || 1) * getBnToNumber(sUSDSExRateBn);

    prices['_timestamp'] = Date.now();

    await redisSetWithTimestamp(pricesCacheKey, prices);

    res.status(200).json(prices)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      console.error('Api call failed trying to return last cache');
      const cache = await getCacheFromRedis(pricesCacheKey, false);
      if (cache) {
        console.error('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch (e) {
      console.error('Error fetching last cache');
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}