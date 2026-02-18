import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { timestampToUTC } from '@app/util/misc';
import { jdolaStakingCacheKey } from './junior/jdola-staking';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

  try {
    const data = await (await fetch('https://www.inverse.finance/api/junior/jdola-staking?ignoreCache=true'))?.json();
    const now = Date.now();
    const utcDate = timestampToUTC(now);

    await redisSetWithTimestamp(`jrdola-staking-snapshot-${utcDate}`, {
      apiVersion: jdolaStakingCacheKey,
      ...data,
    });

    const history = await getCacheFromRedis(`jrdola-staking-history`, false, 0, true) || { entries: [] };
    history.entries = history.entries.concat(data);

    await redisSetWithTimestamp(`jrdola-staking-history`, {
      timestamp: now,
      entries: history.entries,
    }, true);

    res.status(200).json({
      utcDate,
      success: true,
      dataTimestamp: data?.timestamp,      
      apiVersion: jdolaStakingCacheKey,
      historyEntries: history.entries.length,
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}