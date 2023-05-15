import 'source-map-support'
import { getCacheFromRedis, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { formatAndFilterZapperData, getZapperApps, getZapperRemainingPoints } from '@app/util/zapper';
import { getNetworkConfigConstants } from '@app/util/networks';
import { isAddress } from 'ethers/lib/utils';
import { F2_MARKET_ABI } from '@app/config/abis';
import { getProvider } from '@app/util/providers';
import { NetworkIds } from '@app/types';
import { Contract } from 'ethers';
import { BURN_ADDRESS } from '@app/config/constants';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { user, fresh } = req.query;

  if (!user || !isAddress(user) || isInvalidGenericParam(user)) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }

  const cacheKey = `user-rewards-1-${user}`;

  const APP_GROUPS = F2_MARKETS.filter(m => !!m.zapperAppGroup).map(m => m.zapperAppGroup);

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 60);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(NetworkIds.mainnet);

    const userEscrows = await Promise.all(
      F2_MARKETS
        .filter(market => market.hasClaimableRewards)
        .map(market => {
          const contract = new Contract(market.address, F2_MARKET_ABI, provider);
          return contract.escrows(user);
        })
    );

    const activeEscrows = userEscrows.filter(escrow => escrow !== BURN_ADDRESS);

    const pointsData = await getZapperRemainingPoints();
    const data = pointsData.hasPoints && activeEscrows.length ? await getZapperApps(activeEscrows) : [];

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
      } else {
        res.status(200).json({ status: 'ko' });
      }
    } catch (e) {
      console.error(e);
      res.status(200).json({ status: 'ko' });
    }
  }
}