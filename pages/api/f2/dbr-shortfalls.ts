import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';

const { F2_MARKETS, DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `f2dbr-v1.0.0`;
  const uniqueUsersCache = `f2unique-users-v1.0.4`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 30);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const uniqueUsersCacheData = (await getCacheFromRedis(uniqueUsersCache, false)) || null;
    if(!uniqueUsersCacheData) {
      return res.json({});
    }

    const dbrContract = new Contract(DBR, DBR_ABI, provider);

    const marketUsersAndEscrows = uniqueUsersCacheData?.marketUsersAndEscrows || {  };
    let dbrUsers: string[] = [];

    F2_MARKETS.map(market => {
      const marketUsers = marketUsersAndEscrows[market.address]?.users || [];
      dbrUsers = dbrUsers.concat(marketUsers);
    });

    dbrUsers = [...new Set(dbrUsers)];

    const [signedBalances, debts] = await Promise.all([
      Promise.all(dbrUsers.map(u => {
        return dbrContract.signedBalanceOf(u);
      })),
      Promise.all(
        dbrUsers.map(u => {
          return dbrContract.debts(u);
        })
      ),
    ]);

    const shortfalls = signedBalances.map((bn, i) => {
      return { balance: getBnToNumber(bn), debt: getBnToNumber(debts[i]), account: dbrUsers[i] };
    }).filter(p => p.balance < 0);
    
    const resultData = {
      dbrUsers,
      shortfalls,
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