import 'source-map-support'
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { Prices } from '@app/types'
import { CHAIN_TOKENS } from '@app/variables/tokens'

export const cgPricesCacheKey = `cg-prices-v1.0.0`;
// proxy api for cg as fallback to direct call to cg api from client side (can be blocked in some regions)
export default async function handler(req, res) {
  const { cacheFirst, ids, isDefault } = req.query;
  const idsArray = ((ids || '')?.split(',')?.filter(id => !!id) || []);
  if (idsArray.some(id => isInvalidGenericParam(id))) {
    return res.status(400).json({ msg: 'invalid request' });  
  }
  const cacheKey = isDefault === 'true' ? cgPricesCacheKey : `${cgPricesCacheKey}-${ids}`;
  try {
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const { data: cachedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration);
    if (cachedData && isValid) {
      res.status(200).json(cachedData);
      return
    }

    let coingeckoIds: string[] = [];
    if (!idsArray.length) {
      Object.values(CHAIN_TOKENS)
        .forEach(tokenList => {
          Object.values(tokenList)
            .filter(t => !!t.coingeckoId)
            .forEach(t => coingeckoIds.push(t.coingeckoId!))
        });
    } else {
      coingeckoIds = idsArray;
    }

    const uniqueCgIds = [...new Set(coingeckoIds)];
    let geckoPrices: Prices["prices"] = {};

    const result = await fetch(`https://pro-api.coingecko.com/api/v3/simple/price?x_cg_pro_api_key=${process.env.CG_PRO}&vs_currencies=usd&ids=${uniqueCgIds.join(',')}`);
    geckoPrices = await result.json();
    const cgOk = !!geckoPrices?.['inverse-finance']?.usd;
    if(!cgOk) {
      return res.status(200).json({ isCached: true, ...cachedData });
    }
    await redisSetWithTimestamp(cacheKey, geckoPrices);

    return res.status(200).json({ _timestamp: Date.now(), ...geckoPrices });
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