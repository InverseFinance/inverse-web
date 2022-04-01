import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { Prices, Token } from '@app/types'
import { CHAIN_TOKENS } from '@app/variables/tokens'
import { getLPPrice } from '@app/util/contracts'
import { getProvider } from '@app/util/providers'

export default async function handler(req, res) {
  const cacheKey = `prices-v1.0.0`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 600);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const prices = {};
    let coingeckoIds: string[] = [];

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

      Object.entries(geckoPrices).forEach(([key, value]) => {
        prices[key] = value.usd;
      })
    } catch (e) {
      console.log('Error fetching gecko prices');
    }

    let lps: { token: Token, chainId: string }[] = [];

    Object.entries(CHAIN_TOKENS)
      .forEach(([chainId, tokenList]) => {
        Object.values(tokenList)
          .filter(t => (t.pairs?.length > 0 || t.lpPrice || t.isCrvLP))
          .forEach(t => {
            lps.push({ token: t, chainId });
          })
      })

    const lpData = await Promise.all([
      ...lps.map(lp => {
        return getLPPrice(lp.token, lp.chainId, getProvider(lp.chainId));
      })
    ]);

    lps.forEach((lpToken, i) => {
      prices[lpToken.token.symbol] = lpData[i];
    })

    await redisSetWithTimestamp(cacheKey, prices);

    res.status(200).json(prices)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
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