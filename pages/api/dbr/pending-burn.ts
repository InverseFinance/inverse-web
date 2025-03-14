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

export default async function handler(req, res) {

  try {
    const cacheDuration = 300;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(dbrPendingBurnCacheKey, true, cacheDuration);

    if (validCache) {
      res.status(200).send(validCache);
      return
    }

    const dbrSpenders = await getCacheFromRedis(DBR_SPENDERS_CACHE_KEY, false) || { activeDbrHolders: [] };
    const actualSpenders = dbrSpenders.activeDbrHolders.filter(s => s.debt > 1);

    const provider = getProvider(NetworkIds.mainnet);
    const contract = new Contract(DBR, DBR_ABI, provider);

    const now = Date.now();

    const lastUpdatesInSeconds = await getMulticallOutput(
      actualSpenders.map(s => {
        return {
          contract,
          functionName: 'lastUpdated',
          params: [s.user],
        }
      }),
      1,
    );

    const pendingBurns = actualSpenders.map((s, i) => {
      const lastUpdateTimestamp = lastUpdatesInSeconds[i] * 1000;
      const msSinceLastUpdate = (now - lastUpdateTimestamp);
      const dailyBurn = s.debt * msSinceLastUpdate / (365 * ONE_DAY_MS);
      return {
        user: s.user,
        pendingBurn: dailyBurn,
      }
    });

    pendingBurns.sort((a, b) => b.pendingBurn - a.pendingBurn);

    const totalPendingBurn = pendingBurns.reduce((acc, s) => acc + s.pendingBurn, 0);

    // const result = {
    //   timestamp: now,
    //   totalPendingBurn,
    //   pendingBurns,
    // }

    await redisSetWithTimestamp(dbrPendingBurnCacheKey, totalPendingBurn);

    res.status(200).send(totalPendingBurn);
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(dbrPendingBurnCacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).send(cache);
      }
    } catch (e) {
      console.error(e);
    }
  }
}