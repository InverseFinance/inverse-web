import { Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';

const { F2_MARKETS } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const cacheKey = `f2shortfalls-v1.0.0`;
  const uniqueUsersCache = `f2unique-users-v1.0.1`;

  try {
    const validCache = await getCacheFromRedis(cacheKey, true, 30);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const uniqueUsersCacheData = (await getCacheFromRedis(uniqueUsersCache, false)) || { latestBlockNumber: 15818288, users: [] };
    let { latestBlockNumber, users: uniqueUsers } = uniqueUsersCacheData;
    const afterLastBlock = latestBlockNumber + 1;

    const [
      escrowCreations,
    ] = await Promise.all([
      Promise.all(
        F2_MARKETS.map(m => {
          const market = new Contract(m.address, F2_MARKET_ABI, provider);
          return market.queryFilter(market.filters.CreateEscrow(), afterLastBlock);
        })
      ),
    ]);

    escrowCreations.forEach(marketEscrows => {
      marketEscrows.forEach(escrowCreationEvent => {
        if (!uniqueUsers.includes(escrowCreationEvent.args[0])) {
          uniqueUsers.push(escrowCreationEvent.args[0]);
        }
        if (escrowCreationEvent.blockNumber > latestBlockNumber) {
          latestBlockNumber = escrowCreationEvent.blockNumber;
        }
      });
    });

    await redisSetWithTimestamp(uniqueUsersCache, { users: uniqueUsers, latestBlockNumber: latestBlockNumber });

    const groupedLiqDebt =
      await Promise.all(
        F2_MARKETS
          .map(m => {
            const market = new Contract(m.address, F2_MARKET_ABI, provider);
            return Promise.all(
              uniqueUsers.map(u => {
                return market.getLiquidatableDebt(u);
              })
            )
          })
      );
    const shortfalls = F2_MARKETS.map((m, marketIndex) => {
      return uniqueUsers.map((user, userIndex) => {
        return {
          marketIndex,
          user,
          liquidatableDebt: getBnToNumber(groupedLiqDebt[marketIndex][userIndex]),
        }
      });
    })
      .flat()
      .filter(d => d.liquidatableDebt > 0);

    const resultData = {
      shortfalls,
      uniqueUsers,
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