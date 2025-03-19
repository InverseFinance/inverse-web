import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { TOKENS } from '@app/variables/tokens'
import { homogeneizeLpName } from '@app/util/markets'
import { SERVER_BASE_URL } from '@app/config/constants';

export default async function handler(req, res) {
  const cacheKey = `tokens-v1.0.0`;

  try {
    const cacheDuration = 3600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
    res.setHeader('Access-Control-Allow-Origin', `*`);
    res.setHeader('Access-Control-Allow-Methods', `GET`);
    
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const tokens = Object.values(TOKENS).map(t => ({
      address: t.address,
      name: t.name,
      symbol: homogeneizeLpName(t.symbol),
      image: t.image.replace(/^\//, `${SERVER_BASE_URL}/`),
      protocolImage: t.protocolImage,
      isLP: t.isLP,
      isStable: t.isStable,
      decimals: t.decimals,
      lpTokens: t.pairs,
      lpTokensImages: t.pairs ? t.pairs.map(p => TOKENS[p]?.image.replace(/^\//, `${SERVER_BASE_URL}/`)) : undefined,
    })).filter(t => !t.address);

    await redisSetWithTimestamp(cacheKey, tokens);

    res.status(200).send(tokens);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if(cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch(e) {
      console.error(e);
    }
  }
}