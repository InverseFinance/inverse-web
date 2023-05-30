import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getStabilizerContract } from '@app/util/contracts'
import { getProvider } from '@app/util/providers'
import { getBnToNumber } from '@app/util/markets'

export default async function handler(req, res) {
  const cacheKey = `stabilizer-fees-v1.0.0`;

  try {
    const cacheDuration = 600;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(process.env.NEXT_PUBLIC_CHAIN_ID!);

    const stabilizerConract = getStabilizerContract(provider);
    const fees = await Promise.all([
      stabilizerConract.buyFee(),
      stabilizerConract.sellFee(),
    ])

    const result = {
      buyFee: getBnToNumber(fees[0], 4),
      sellFee: getBnToNumber(fees[1], 4),
    }

    await redisSetWithTimestamp(cacheKey, result);

    res.status(200).json(result)
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