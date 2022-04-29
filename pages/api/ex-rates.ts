import "source-map-support";
import { getCacheFromRedis, getRedisClient } from '@app/util/redis';

export default async function handler(req, res) {
  try {
    let data: any = await getCacheFromRedis(`exRates`, false);

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500);
  }
};
