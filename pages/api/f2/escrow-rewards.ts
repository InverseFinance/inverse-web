import 'source-map-support'
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getZapperApps, formatAndFilterZapperData, getZapperRemainingPoints } from '@app/util/zapper';
import { getNetworkConfigConstants } from '@app/util/networks';
import { isAddress } from 'ethers/lib/utils';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { escrow, fresh } = req.query;

  if (!escrow || !isAddress(escrow) || isInvalidGenericParam(escrow)) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }

  const cacheKey = `escrow-rewards-1-${escrow}`;

  const APP_GROUPS = F2_MARKETS.filter(m => !!m.zapperAppGroup).map(m => m.zapperAppGroup);

  try {
    const cacheDuration = 30;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, fresh !== 'true', cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }
    
    const pointsData = await getZapperRemainingPoints();
    const data = pointsData.hasPoints ? await getZapperApps([escrow]) : [];

    let appGroupPositions = formatAndFilterZapperData(data, APP_GROUPS);

    const resultData = {
      timestamp: +(new Date()),
      appGroupPositions,
      rateLimited: !pointsData.hasPoints,
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
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
    }
  }
}