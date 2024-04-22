import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { Prices } from '@app/types'
import { CHAIN_TOKENS } from '@app/variables/tokens'

export const cgPricesCacheKey = `cg-prices-v1.0.0`;
// proxy api for cg as fallback to direct call to cg api from client side (can be blocked in some regions)
export default async function handler(req, res) {
  const { cacheFirst } = req.query;
  try {
    const cacheDuration = 90;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cgPricesCacheKey, cacheFirst !== 'true', cacheDuration);
    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return
    }

    let coingeckoIds: string[] = [];

    Object.values(CHAIN_TOKENS)
      .forEach(tokenList => {
        Object.values(tokenList)
          .filter(t => !!t.coingeckoId)
          .forEach(t => coingeckoIds.push(t.coingeckoId!))
      })

    const uniqueCgIds = [...new Set(coingeckoIds)];
    let geckoPrices: Prices["prices"] = {};

    const result = await fetch(`${process.env.COINGECKO_PRICE_API}?vs_currencies=usd&ids=${uniqueCgIds.join(',')}`);
    geckoPrices = await result.json();

    await redisSetWithTimestamp(cgPricesCacheKey, geckoPrices);

    return res.status(200).json({ _timestamp: Date.now(), ...geckoPrices });
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cgPricesCacheKey, false);
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