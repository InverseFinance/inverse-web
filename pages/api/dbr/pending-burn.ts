import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types'
import { ONE_DAY_MS } from '@app/config/constants';
import { DBR_SPENDERS_CACHE_KEY } from '../f2/dbr-deficits';
import { getMulticallOutput } from '@app/util/multicall';

const { DBR } = getNetworkConfigConstants();

export const dbrPendingBurnCacheKey = `dbr-pending-burn-v1.0.0`;

export const getPendingDbrBurn = async (_block?: number, _now?: number, isDetails = false) => {
  try {
    const dbrSpenders = await getCacheFromRedis(DBR_SPENDERS_CACHE_KEY, false) || { activeDbrHolders: [] };
    const actualSpenders = dbrSpenders.activeDbrHolders.filter(s => _block ? true : s.debt >= 1);

    const provider = getProvider(NetworkIds.mainnet);
    const contract = new Contract(DBR, DBR_ABI, provider);

    const now = _now || Date.now();

    const lastUpdatesInSeconds = await getMulticallOutput(
      actualSpenders.map(s => {
        return {
          contract,
          functionName: 'lastUpdated',
          params: [s.user],
        }
      }),
      1,
      _block,
    );

    const pendingBurns = actualSpenders.map((s, i) => {
      const lastUpdateTimestamp = lastUpdatesInSeconds[i] * 1000;
      const deltaMs = (now - lastUpdateTimestamp);
      const pendingBurn = s.debt * deltaMs / (365 * ONE_DAY_MS);
      return {
        user: s.user,
        pendingBurn,
        lastUpdateTimestamp,
        debt: s.debt,
        dailyBurn: s.debt / 365,
        refTimeMs: now,
        deltaMs,
        deltaDays: deltaMs / ONE_DAY_MS,
      }
    });
    return isDetails ? pendingBurns : pendingBurns.reduce((acc, s) => acc + s.pendingBurn, 0);
  } catch (err) {
    console.error(err);
    return 0;
  }
}

export default async function handler(req, res) {
  const { showDetails } = req.query;
  const isDetails = showDetails === 'true';
  const cacheKey = isDetails ? `${dbrPendingBurnCacheKey}-${showDetails}` : dbrPendingBurnCacheKey;
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).send(validCache);
      return
    }

    const result = await getPendingDbrBurn(undefined, undefined, isDetails);

    await redisSetWithTimestamp(cacheKey, result);

    res.status(200).send(result);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch (e) {
      console.error(e);
    }
  }
}