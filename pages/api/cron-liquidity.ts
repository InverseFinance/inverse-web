import 'source-map-support'
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis';
import { timestampToUTC } from '@app/util/misc';
import { liquidityCacheKey } from './transparency/liquidity';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false });
  else if (req.headers.authorization !== `Bearer ${process.env.API_SECRET_KEY}`) return res.status(401).json({ success: false });

  try {
    const liquidityData = await (await fetch('https://www.inverse.finance/api/transparency/liquidity'))?.json();
    const utcDate = timestampToUTC(+(new Date()));

    await redisSetWithTimestamp(`liquidity-snapshot-${utcDate}`, {
      liquidityApiVersion: liquidityCacheKey,
      ...liquidityData,
    });

    const history = (await getCacheFromRedis(`liquidity-history`, false, 0, true)) || { entries: [] };
    history.entries = history.entries.concat(liquidityData);

    await redisSetWithTimestamp(`liquidity-history`, {
      timestamp: +(new Date()),
      entries: history.entries,
    }, true);

    res.status(200).json({
      utcDate,
      success: true,
      dataTimestamp: liquidityData?.timestamp,
      nbPools: liquidityData?.liquidity?.length,
      liquidityApiVersion: liquidityCacheKey,
      historyEntries: history.entries.length,
    });
  } catch (err) {
    console.error(err);
    res.status(200).json({ success: false })
  }
}