import "source-map-support";
import { getCacheFromRedis } from '@app/util/redis';

export default async function handler(req, res) {
  const cacheDuration = 300;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  try {
    let data: any = await getCacheFromRedis(`exRates`, false);

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500);
  }
};
