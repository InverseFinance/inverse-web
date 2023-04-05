import 'source-map-support'
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getZapperApps } from '@app/util/zapper';
import { getNetworkConfigConstants } from '@app/util/networks';
import { isAddress } from 'ethers/lib/utils';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { escrow, fresh } = req.query;

  if (!escrow || !isAddress(escrow) || isInvalidGenericParam(escrow)) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }

  const cacheKey = `escrow-apps-${escrow}`;

  const APP_GROUPS = F2_MARKETS.filter(m => !!m.zapperAppGroup).map(m => m.zapperAppGroup);

  try {
    const validCache = await getCacheFromRedis(cacheKey, fresh !== 'true', 60000);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const data = await getZapperApps(escrow);

    let appGroupPositions = [];

    data
      .forEach(app => {
        app.products.filter(
          product => !!product.assets
            .find(a => APP_GROUPS.includes(`${app.appId}+${a.groupId}`))
        ).forEach(
          product => {
            appGroupPositions = appGroupPositions.concat(
              product.assets.filter(a => APP_GROUPS.includes(`${app.appId}+${a.groupId}`))
                .map(a => {
                  return {
                    updatedAt: app.updatedAt,
                    timestamp: +(new Date(app.updatedAt)),
                    appGroup: `${app.appId}+${a.groupId}`,
                    tokens: a.tokens,
                    balanceUSD: a.balanceUSD,
                    address: a.address,
                  }
                })
            )
          })
      })

    const resultData = {
      timestamp: +(new Date()),
      appGroupPositions,
    }

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(assets)
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