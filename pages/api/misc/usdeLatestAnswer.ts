import { Contract } from 'ethers'
import 'source-map-support'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'

export default async function handler(req, res) {
  const cacheKey = `latest-answer-v1.0.0`;

  try {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);
    if(validCache) {
      res.status(200).send(validCache);
      return
    }

    const provider = getProvider("1");
    const contract = new Contract('0x6277cB27232F35C75D3d908b26F3670e7d167400', ["function latestAnswer() external view returns (int256)"], provider);

    const latestAnswerBn = await contract.latestAnswer()

    const latestAnswer = getBnToNumber(latestAnswerBn);

    await redisSetWithTimestamp(cacheKey, latestAnswer);

    res.status(200).send(latestAnswer);
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