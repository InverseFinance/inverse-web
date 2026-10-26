import { BigNumber, Contract } from 'ethers'
import { hexValue, Interface } from 'ethers/lib/utils'
import 'source-map-support'
import { F2_MARKET_ABI, F2_ESCROW_ABI, DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { CHAIN_ID, ONE_DAY_MS } from '@app/config/constants';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { F2_MARKETS_CACHE_KEY } from './fixed-markets';
import { uniqueBy } from '@app/util/misc';
import { getGroupedMulticallOutputs, getMulticallOutput, sliceIntoChunks } from '@app/util/multicall';
import { JsonRpcProvider } from '@ethersproject/providers';

const { F2_MARKETS, DBR } = getNetworkConfigConstants();

export const F2_POSITIONS_CACHE_KEY = 'f2positions-v1.1.1'
export const F2_UNIQUE_USERS_CACHE_KEY = 'f2unique-users-v1.0.91'

export const getFirmMarketUsers = async (provider, cacheDuration = 240) => {
  const { data: _uniqueUsersCacheData, isValid: isUniqueUsersCacheValid } = (await getCacheFromRedisAsObj(F2_UNIQUE_USERS_CACHE_KEY, true, cacheDuration));
  if(isUniqueUsersCacheValid && !!_uniqueUsersCacheData?.firmMarketUsers) {
    return _uniqueUsersCacheData;
  }
  const uniqueUsersCacheData = _uniqueUsersCacheData || {
    latestBlockNumber: undefined,
    marketUsersAndEscrows: {}, // with marketAddress: { users: [], escrows: [] }
  };
  const currentBlock = await provider.getBlockNumber();
  let { latestBlockNumber, marketUsersAndEscrows } = uniqueUsersCacheData;
  let afterLastBlock = latestBlockNumber !== undefined ? latestBlockNumber + 1 : undefined;

  // a single eth_getLogs for all the markets, ethers v5 filters take only one address
  const marketInterface = new Interface(F2_MARKET_ABI);
  const escrowCreationLogs = await provider.send('eth_getLogs', [{
    address: F2_MARKETS.map(m => m.address),
    topics: [marketInterface.getEventTopic('CreateEscrow')],
    fromBlock: hexValue(afterLastBlock || 0),
    toBlock: hexValue(currentBlock),
  }]);

  F2_MARKETS.forEach(market => {
    if (!marketUsersAndEscrows[market.address]) {
      marketUsersAndEscrows[market.address] = { users: [], escrows: [] };
    }
  });

  const marketsByAddress = Object.fromEntries(F2_MARKETS.map(m => [m.address.toLowerCase(), m]));
  escrowCreationLogs.forEach((log: { address: string, topics: string[], data: string }) => {
    const market = marketsByAddress[log.address.toLowerCase()];
    const [user, escrow] = marketInterface.parseLog(log).args;
    if (!marketUsersAndEscrows[market.address].users.includes(user)) {
      marketUsersAndEscrows[market.address].users.push(user);
      marketUsersAndEscrows[market.address].escrows.push(escrow);
    }
  });

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

  await redisSetWithTimestamp(F2_UNIQUE_USERS_CACHE_KEY, { latestBlockNumber: currentBlock, marketUsersAndEscrows, firmMarketUsers });

  return { firmMarketUsers, marketUsersAndEscrows };
}

// max number of calls per multicall, a getCreditLimit call uses ~50k gas
const MULTICALL_CHUNK_SIZE = 500;

// multicalls of at most MULTICALL_CHUNK_SIZE calls, in try mode so that a reverting call returns its fallback value
const getChunkedMulticallOutput = async (callRequests: Parameters<typeof getMulticallOutput>[0], provider: JsonRpcProvider) => {
  const outputs = await Promise.all(
    sliceIntoChunks(callRequests, MULTICALL_CHUNK_SIZE).map(chunk => getMulticallOutput(chunk, 1, undefined, provider, true))
  );
  return outputs.flat();
}

// positions of all the FiRM users, on a tenderly vnet when vnetPublicId is set
export const getFirmPositions = async (provider, paidProvider, vnetPublicId?: string) => {
  const [marketUsersCache, marketsCache] = await Promise.all([
    getFirmMarketUsers(paidProvider),
    (vnetPublicId ?
      fetch(`https://www.inverse.finance/api/f2/fixed-markets?v=1.2&vnetPublicId=${vnetPublicId||''}`).then(r => r.json())
       : getCacheFromRedis(F2_MARKETS_CACHE_KEY, false)),
  ])
  const { firmMarketUsers, marketUsersAndEscrows } = marketUsersCache;
  const _markets = marketsCache?.markets || F2_MARKETS;

  let dbrUsers: string[] = [];
  const dbrContract = new Contract(DBR, DBR_ABI, provider);

  _markets.map(market => {
    const marketUsers = marketUsersAndEscrows[market.address]?.users || [];
    dbrUsers = dbrUsers.concat(marketUsers);
  });

  dbrUsers = [...new Set(dbrUsers)];

  const [dbrSignedBalanceBn, totalDebtsBn, dueTokensAccruedBn, lastUpdatedBn] = await getGroupedMulticallOutputs(
    [
      dbrUsers.map(u => {
        return { contract: dbrContract, functionName: 'signedBalanceOf', params: [u] }
      }),
      dbrUsers.map(u => {
        return { contract: dbrContract, functionName: 'debts', params: [u] }
      }),
      dbrUsers.map(u => {
        return { contract: dbrContract, functionName: 'dueTokensAccrued', params: [u] }
      }),
      dbrUsers.map(u => {
        return { contract: dbrContract, functionName: 'lastUpdated', params: [u] }
      }),
    ],
    1,
    undefined,
    provider,
  );

  // separate multicalls of bounded size: in a single multicall, one reverting call makes the whole batch fail
  const [debtsBn, depositsBn, creditLimitsBn] = await Promise.all([
    getChunkedMulticallOutput(
      firmMarketUsers.map((f, i) => {
        const market = new Contract(F2_MARKETS[f.marketIndex].address, F2_MARKET_ABI, provider);
        return { contract: market, functionName: 'debts', params: [f.user] };
      }),
      provider,
    ),
    getChunkedMulticallOutput(
      firmMarketUsers.map((f, i) => {
        const marketAd = F2_MARKETS[f.marketIndex].address;
        const users = marketUsersAndEscrows[marketAd].users;
        const escrow = new Contract(marketUsersAndEscrows[marketAd].escrows[users.indexOf(f.user)], F2_ESCROW_ABI, provider);
        return { contract: escrow, functionName: 'balance', params: [] };
      }),
      provider,
    ),
    getChunkedMulticallOutput(
      firmMarketUsers.map((f, i) => {
        const market = F2_MARKETS[f.marketIndex];
        const marketContract = new Contract(market.address, F2_MARKET_ABI, provider);
        // getCreditLimit reverts when the oracle feed is invalid
        return { contract: marketContract, functionName: 'getCreditLimit', params: [f.user], forceFallback: !!market.hasNowInvalidFeed, fallbackValue: BigNumber.from('0') };
      }),
      provider,
    ),
  ]);

  const deposits = depositsBn.map((bn, i) => getBnToNumber(bn, getToken(CHAIN_TOKENS[CHAIN_ID], F2_MARKETS[firmMarketUsers[i].marketIndex].collateral)?.decimals));
  const debts = debtsBn.map((bn) => getBnToNumber(bn));
  const creditLimits = creditLimitsBn.map((bn) => getBnToNumber(bn));
  const liquidableDebts = creditLimits.map((creditLimit, i) => (creditLimit >= debts[i] ? 0 : debts[i] * (_markets[firmMarketUsers[i].marketIndex]?.liquidationFactor || 1)));
  const now = Date.now();

  const positions = firmMarketUsers.map((f, i) => {
    const dbrIdx = dbrUsers.findIndex(du => du === f.user);
    const lastUpdatedMs = getBnToNumber(lastUpdatedBn[dbrIdx], 0) * 1000;
    const dueTokensStored = getBnToNumber(dueTokensAccruedBn[dbrIdx]);
    const totalDebt = getBnToNumber(totalDebtsBn[dbrIdx]);
    return {
      ...f,
      liquidatableDebt: liquidableDebts[i],
      deposits: deposits[i],
      debt: debts[i],
      totalDebt: totalDebt,
      dbrBalance: getBnToNumber(dbrSignedBalanceBn[dbrIdx]),
      dueTokensAccruedStored: dueTokensStored,
      // live
      dueTokensAccrued: dueTokensStored + (now - lastUpdatedMs) * totalDebt / (365 * ONE_DAY_MS),
      lastAccrualUpdate: lastUpdatedMs,
    }
  });

  return {
    nbUniqueUsers: uniqueBy(positions, (a, b) => a.user === b.user).length,
    positions: positions.filter((p, i) => p.debt > 0 || (p.deposits * _markets[firmMarketUsers[i].marketIndex].price >= 1)),
    // marketUsersAndEscrows,
    timestamp: now,
  }
}

export default async function handler(req, res) {
  const { cacheFirst, vnetPublicId } = req.query;

  if (!!vnetPublicId && isInvalidGenericParam(vnetPublicId)) {
    console.log('invalid vnetPublicId');
    res.status(400).json({ status: 'error', message: 'Invalid vnetPublicId' });
    return;
  }

  const cacheKey = vnetPublicId ? `f2positions-sim-${vnetPublicId}` : F2_POSITIONS_CACHE_KEY;

  try {
    const cacheDuration = vnetPublicId ? 120 : 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }

    let provider, paidProvider;
    if (vnetPublicId) {
      // const cachedSims = (await getCacheFromRedis(SIMS_CACHE_KEY, false));
      // const { ids } =  cachedSims || { ids: [] };
      // const vnet = ids.find(id => id.publicId === vnetPublicId);
      // if(!vnet) {
      //   res.status(404).json({ success: false, error: 'Vnet not found' });
      //   return;
      // }
      // provider = new JsonRpcProvider(vnet.publicRpc);
      provider = new JsonRpcProvider(`https://virtual.mainnet.rpc.tenderly.co/${vnetPublicId}`);
      paidProvider = provider;
    } else {
      provider = getProvider(CHAIN_ID);
      paidProvider = getPaidProvider(CHAIN_ID);
    }

    const resultData = await getFirmPositions(provider, paidProvider, vnetPublicId);

    await redisSetWithTimestamp(cacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    // console.error(err);
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
