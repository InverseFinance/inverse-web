import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { timestampToUTC } from '@app/util/misc';
import { invStakingCacheKey } from './inv-staking';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

  try {
    const data = await (await fetch('https://www.inverse.finance/api/inv-staking?ignoreCache=true'))?.json();
    const now = Date.now();
    const utcDate = timestampToUTC(now);

    await redisSetWithTimestamp(`inv-staking-snapshot-${utcDate}`, {
      apiVersion: invStakingCacheKey,
      ...data,
    });

    const history = await getCacheFromRedis(`inv-staking-history`, false, 0, true) || { entries: [] };
    history.entries = history.entries.concat(data);

    await redisSetWithTimestamp(`inv-staking-history`, {
      timestamp: now,
      entries: history.entries,
    }, true);

    res.status(200).json({
      utcDate,
      success: true,
      dataTimestamp: data?.timestamp,      
      apiVersion: invStakingCacheKey,
      historyEntries: history.entries.length,
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}