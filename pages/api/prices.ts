import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds, Prices, Token } from '@app/types'
import { CHAIN_TOKENS } from '@app/variables/tokens'
import { getLPPrice } from '@app/util/contracts'
import { getProvider } from '@app/util/providers'
import { getNetworkConfigConstants } from '@app/util/networks'
import { COMPTROLLER_ABI, ORACLE_ABI } from '@app/config/abis'
import { BigNumber, Contract } from 'ethers'
import { formatUnits } from '@ethersproject/units'
import { getTokenData } from '@app/util/livecoinwatch'
import { getDolaUsdPriceOnCurve } from '@app/util/f2'
import { dolaStakingCacheKey } from './dola-staking'

export const pricesCacheKey = `prices-v1.0.8`;
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

    Object.values(CHAIN_TOKENS)
      .forEach(tokenList => {
        Object.values(tokenList)
          .filter(t => !!t.coingeckoId)
          .forEach(t => coingeckoIds.push(t.coingeckoId!))
      })

    const uniqueCgIds = [...new Set(coingeckoIds)];
    let geckoPrices: Prices["prices"] = {};

    try {
      const res = await fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${uniqueCgIds.join(',')}`);
      geckoPrices = await res.json();

      await redisSetWithTimestamp(cgPricesCacheKey, geckoPrices);
    } catch (e) {
      console.log('Error fetching gecko prices');
      geckoPrices = (await getCacheFromRedis(cgPricesCacheKey, false)) || {};      
    }
    
    try {
      prices['dola-usd-cg'] = geckoPrices['dola-usd']?.usd;
      const dolaData = await getTokenData('DOLA');
      if(dolaData?.rate){
        prices['dola-usd-lcw'] = dolaData.rate;
      }
    } catch (e) {
      console.log('Error livecoinwatch gecko prices');     
    }

    Object.entries(geckoPrices).forEach(([key, value]) => {
      prices[key] = value.usd;
    });
    
    const [dolaUsdCurveData, dolaStakingData] = await Promise.all([
      getDolaUsdPriceOnCurve(getProvider(NetworkIds.mainnet)),
      getCacheFromRedis(dolaStakingCacheKey, false)
    ]);
    
    const { price: dolaOnChainPrice, tvl: crvUsdDolaTvl } = dolaUsdCurveData;
    const { sDolaExRate } = dolaStakingData;
    prices['dola-onchain-usd'] = dolaOnChainPrice;
    prices['dola-usd'] = crvUsdDolaTvl >= 1000000 ? dolaOnChainPrice : prices['dola-usd-cg'] || prices['dola-usd-lcw'];

    let lps: { token: Token, chainId: string }[] = [];

    Object.entries(CHAIN_TOKENS)
      .filter(([chainId]) => chainId !== '31337')
      .forEach(([chainId, tokenList]) => {
        Object.values(tokenList)
          .filter(t => (t.pairs?.length > 0 || t.lpPrice || t.isCrvLP || t.convexInfos))
          .forEach(t => {
            lps.push({ token: t, chainId });
          })
      })

    const lpData = await Promise.all([
      ...lps.map(lp => {
        return getLPPrice(lp.token, lp.chainId, getProvider(lp.chainId), geckoPrices);
      })
    ]);

    lps.forEach((lpToken, i) => {
      if (lpData[i]) {
        prices[lpToken.token.symbol] = lpData[i];
      }
    });

    prices['staked-dola'] = prices['dola-usd'] * sDolaExRate;
    prices['SDOLA'] = prices['staked-dola'];

    prices['_timestamp'] = +(new Date());

    await redisSetWithTimestamp(pricesCacheKey, prices);

    res.status(200).json(prices)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(pricesCacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}