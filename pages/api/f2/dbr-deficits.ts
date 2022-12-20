import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { F2_UNIQUE_USERS_CACHE_KEY } from './firm-positions';

const { F2_MARKETS, DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `f2dbr-v1.0.6`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 30);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const uniqueUsersCacheData = (await getCacheFromRedis(F2_UNIQUE_USERS_CACHE_KEY, false)) || null;
    if (!uniqueUsersCacheData) {
      return res.json({});
    }

    const dbrContract = new Contract(DBR, DBR_ABI, provider);

    const marketUsersAndEscrows = uniqueUsersCacheData?.marketUsersAndEscrows || {};
    let dbrUsers: string[] = [];

    F2_MARKETS.map(market => {
      const marketUsers = marketUsersAndEscrows[market.address]?.users || [];
      dbrUsers = dbrUsers.concat(marketUsers);
    });

    dbrUsers = [...new Set(dbrUsers)];

    const [signedBalanceBn, debtsBn] = await Promise.all(
      [
        Promise.all(dbrUsers.map(u => {
          return dbrContract.signedBalanceOf(u);
        })),
        Promise.all(dbrUsers.map(u => {
          return dbrContract.debts(u);
        })),
      ]
    );

    const activeDbrHolders = signedBalanceBn.map((bn, i) => {
      const signedBalance = getBnToNumber(bn);
      return {
        signedBalance: signedBalance,
        deficit: Math.min(0, signedBalance),
        balance: Math.max(signedBalance, 0),
        debt: getBnToNumber(debtsBn[i]),
        user: dbrUsers[i],
      }
    });

    const resultData = {
      dbrUsers,
      activeDbrHolders,
      timestamp: +(new Date()),
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
        res.status(500).json({ success: false });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false });
    }
  }
}