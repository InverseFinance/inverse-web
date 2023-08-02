import { Contract } from 'ethers'
import 'source-map-support'
import { F2_MARKET_ABI, F2_ESCROW_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID } from '@app/config/constants';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';
import { uniqueBy } from '@app/util/misc';
import { getMulticallOutput } from '@app/util/multicall';

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2_POSITIONS_CACHE_KEY = 'f2positions-v1.0.9'
export const F2_UNIQUE_USERS_CACHE_KEY = 'f2unique-users-v1.0.91'

export const getFirmMarketUsers = async (provider) => {
  const uniqueUsersCacheData = (await getCacheFromRedis(F2_UNIQUE_USERS_CACHE_KEY, false)) || {
    latestBlockNumber: undefined,
    marketUsersAndEscrows: {}, // with marketAddress: { users: [], escrows: [] }
  };
  let { latestBlockNumber, marketUsersAndEscrows } = uniqueUsersCacheData;
  const afterLastBlock = latestBlockNumber !== undefined ? latestBlockNumber + 1 : undefined;

  const escrowCreations = await Promise.all(
    F2_MARKETS.map(m => {
      const market = new Contract(m.address, F2_MARKET_ABI, provider);
      return market.queryFilter(market.filters.CreateEscrow(), afterLastBlock);
    })
  );

  escrowCreations.forEach((marketEscrows, marketIndex) => {
    const market = F2_MARKETS[marketIndex];
    if (!marketUsersAndEscrows[market.address]) {
      marketUsersAndEscrows[market.address] = { users: [], escrows: [] };
    }
    marketEscrows.forEach(escrowCreationEvent => {
      if (!marketUsersAndEscrows[market.address].users.includes(escrowCreationEvent.args[0])) {
        marketUsersAndEscrows[market.address].users.push(escrowCreationEvent.args[0]);
        marketUsersAndEscrows[market.address].escrows.push(escrowCreationEvent.args[1]);
      }
      if (escrowCreationEvent.blockNumber > latestBlockNumber) {
        latestBlockNumber = escrowCreationEvent.blockNumber;
      }
    });
  });

  await redisSetWithTimestamp(F2_UNIQUE_USERS_CACHE_KEY, { latestBlockNumber: latestBlockNumber, marketUsersAndEscrows });

  const usedMarkets = Object.keys(marketUsersAndEscrows);

  const firmMarketUsers = usedMarkets.map((marketAd, usedMarketIndex) => {
    const marketIndex = F2_MARKETS.findIndex(m => m.address === marketAd);
    return marketUsersAndEscrows[marketAd].users.map((user, userIndex) => {
      return {
        marketIndex,
        user,
      }
    });
  })
    .flat()

  return { firmMarketUsers, marketUsersAndEscrows };
}

export default async function handler(req, res) {
  const { cacheFirst } = req.query;
  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(F2_POSITIONS_CACHE_KEY, cacheFirst !== 'true', cacheDuration);
    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    const provider = getProvider(CHAIN_ID);
    const [marketUsersCache, marketsCache] = await Promise.all([
      getFirmMarketUsers(provider),
      getCacheFromRedis(F2_MARKETS_CACHE_KEY, false),
    ])
    const { firmMarketUsers, marketUsersAndEscrows } = marketUsersCache;
    const _markets = marketsCache?.markets || F2_MARKETS;

    const [debtsBn, depositsBn, creditLimitsBn] = await Promise.all(
      [
        await getMulticallOutput(
          firmMarketUsers.map((f, i) => {
            const market = new Contract(F2_MARKETS[f.marketIndex].address, F2_MARKET_ABI, provider);
            return { contract: market, functionName: 'debts', params: [f.user] };            
          })
        ),
        await getMulticallOutput(
          firmMarketUsers.map((f, i) => {
            const marketAd = F2_MARKETS[f.marketIndex].address;
            const users = marketUsersAndEscrows[marketAd].users;
            const escrow = new Contract(marketUsersAndEscrows[marketAd].escrows[users.indexOf(f.user)], F2_ESCROW_ABI, provider);
            return { contract: escrow, functionName: 'balance', params: [] };
          })
        ),
        await getMulticallOutput(
          firmMarketUsers.map((f, i) => {
            const market = new Contract(F2_MARKETS[f.marketIndex].address, F2_MARKET_ABI, provider);            
            // placeholder debts call for the inv market meanwhile oracle feed is invalid
            return { contract: market, functionName: F2_MARKETS[f.marketIndex].isInv ? 'debts' : 'getCreditLimit', params: [f.user] };
          })
        ),
      ]
    );
   
    const deposits = depositsBn.map((bn, i) => getBnToNumber(bn, getToken(CHAIN_TOKENS[CHAIN_ID], F2_MARKETS[firmMarketUsers[i].marketIndex].collateral)?.decimals));
    const debts = debtsBn.map((bn) => getBnToNumber(bn));
    const creditLimits = creditLimitsBn.map((bn) => getBnToNumber(bn));
    const liquidableDebts = creditLimits.map((creditLimit, i) => (creditLimit >= debts[i] ? 0 : debts[i] * (_markets[firmMarketUsers[i].marketIndex]?.liquidationFactor || 0.5)));

    const positions = firmMarketUsers.map((f, i) => {
      return {
        ...f,
        liquidatableDebt: liquidableDebts[i],
        deposits: deposits[i],
        debt: debts[i],
      }
    });

    const resultData = {
      nbUniqueUsers: uniqueBy(positions, (a, b) => a.user === b.user).length,
      positions: positions.filter(p => p.debt > 0 || p.deposits > 0.01),
      // marketUsersAndEscrows,
      timestamp: +(new Date()),
    }

    await redisSetWithTimestamp(F2_POSITIONS_CACHE_KEY, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(F2_POSITIONS_CACHE_KEY, false);
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