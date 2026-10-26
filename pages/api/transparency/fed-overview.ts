import 'source-map-support'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { FedTypes, NetworkIds } from '@app/types';
import { cacheFedDataKey, cacheMultisigDataKey } from './dao';
import { frontierMarketsCacheKey } from '../markets';
import { firmTvlCacheKey } from '../f2/tvl';
import { getBnToNumber } from '@app/util/markets';
import { BigNumber, Contract } from 'ethers';
import { F2_MARKETS_CACHE_KEY } from '../f2/fixed-markets';
import { CTOKEN_ABI, DOLA_ABI } from '@app/config/abis';
import { computeLPBalances, computeLPPrice, getLPBalancesCalls, getLPPriceCalls, getPoolRewards } from '@app/util/contracts';
import { CHAIN_TOKENS, getToken } from '@app/variables/tokens';
import { pricesCacheKey } from '../prices';
import { getGroupedMulticallOutputs, getMulticallOutput } from '@app/util/multicall';
import { BaseProvider } from '@ethersproject/providers';

const { FEDS, ANCHOR_DOLA, DOLA } = getNetworkConfigConstants(NetworkIds.mainnet);

const FUSE_CTOKENS = {
  '0xe3277f1102C1ca248aD859407Ca0cBF128DB0664': '0xf65155C9595F99BFC193CaFF0AAb6e2a98cf68aE',
  '0x7765996dAe0Cf3eCb0E74c016fcdFf3F055A5Ad8': '0x5117D9453cC9Be8c3fBFbA4aE3B858D18fe45903',
  '0x5Fa92501106d7E4e8b4eF3c4d08112b6f306194C': '0xC1Fb01415f08Fbd71623aded6Ac8ec74F974Fdc1',
  // fuse 24 has fully ended
  // '0xCBF33D02f4990BaBcba1974F1A5A8Aea21080E36': '0xa355e89F6b326624fB54310589689144B2A0B3a8',
};
const FUSE_FEDS = Object.entries(FUSE_CTOKENS).map(([fedAddress, ctoken]) => ({ fedAddress, ctoken }));
const OTHER_FEDS = FEDS.filter(f => [FedTypes.CROSS, FedTypes.PSM].includes(f.type) && !!f.borrowConfig);

type CallRequests = Parameters<typeof getMulticallOutput>[0];

// outputs of each group of calls, with a single multicall per chain in try mode: a failing call returns its fallbackValue or null
const getCallGroupsOutputs = async (callGroups: { chainId: string, calls: CallRequests }[], getChainProvider: (chainId: string) => BaseProvider) => {
  const outputs: any[][] = new Array(callGroups.length);
  const chainIds = [...new Set(callGroups.map(group => group.chainId))];
  await Promise.all(chainIds.map(async chainId => {
    const groupIndexes = callGroups.map((group, i) => group.chainId === chainId ? i : -1).filter(i => i !== -1);
    const chainOutputs = await getGroupedMulticallOutputs(groupIndexes.map(i => callGroups[i].calls), Number(chainId), undefined, getChainProvider(chainId), true);
    groupIndexes.forEach((groupIndex, i) => outputs[groupIndex] = chainOutputs[i]);
  }));
  return outputs;
}

export const fedOverviewCacheKey = `fed-overview-v1.0.92`;

export default async function handler(req, res) {
  // to keep for archive  
  const { cacheFirst } = req.query;

  try {
    const cacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
    const validCache = await getCacheFromRedis(fedOverviewCacheKey, cacheFirst !== 'true', cacheDuration);

    if (validCache) {
      res.status(200).json(validCache);
      return
    }
    
    const prices = (await getCacheFromRedis(pricesCacheKey, false)) || {};

    const provider = getProvider(NetworkIds.mainnet);
    // not CTOKEN_ABI: the multicall functionName 'totalBorrows' would match totalBorrowsCurrent (accrues interest) first
    const totalBorrowsAbi = ['function totalBorrows() view returns (uint)'];
    const anDolaContract = new Contract(ANCHOR_DOLA, totalBorrowsAbi, provider);
    const providers: { [chainId: string]: BaseProvider } = { [NetworkIds.mainnet]: provider };
    const getChainProvider = (chainId: string) => {
      if (!providers[chainId]) {
        providers[chainId] = getProvider(chainId);
      }
      return providers[chainId];
    }

    // all the calls are batched with a single multicall per chain
    const callGroups: { chainId: string, calls: CallRequests }[] = [];
    const addCallGroup = (chainId: string, calls: CallRequests) => callGroups.push({ chainId, calls }) - 1;

    const anDolaBorrowsGroup = addCallGroup(NetworkIds.mainnet, [{ contract: anDolaContract, functionName: 'totalBorrows' }]);
    const fuseBorrowsGroup = addCallGroup(NetworkIds.mainnet, FUSE_FEDS.map(fuseFed => {
      return { contract: new Contract(fuseFed.ctoken, totalBorrowsAbi, provider), functionName: 'totalBorrows' };
    }));
    const otherFedsBorrowsGroups = OTHER_FEDS.map(fed => {
      const chainProvider = getChainProvider(fed.chainId);
      const contract = new Contract(fed.borrowConfig!.contractAddress, fed.borrowConfig!.abi, chainProvider);
      if (!fed.borrowConfig?.customCalls) {
        return addCallGroup(fed.chainId, [{ contract, functionName: fed.borrowConfig!.functionName }]);
      }
      return addCallGroup(fed.chainId, fed.borrowConfig.customCalls.map(call => ({
        contract: call.onFed ? new Contract(fed.address, [`function ${call.functionName}() view returns (uint)`], chainProvider) : contract,
        functionName: call.functionName,
        params: call.params || [],
      })));
    });
    const lpFedsGroups = FEDS.map(lpFed => {
      if (!lpFed.strategy?.lpBalanceContract) {
        return null;
      }
      const address = lpFed.incomeSrcAd || lpFed.address;
      const chainId = lpFed.incomeChainId || lpFed.chainId;
      const chainProvider = getChainProvider(chainId);
      const contract = new Contract(lpFed.strategy.lpBalanceContract, CTOKEN_ABI, chainProvider);
      const token = CHAIN_TOKENS[chainId][lpFed.strategy.pools[0].address];
      return {
        chainId,
        token,
        balanceAndSupply: addCallGroup(chainId, [
          { contract, functionName: 'balanceOf', params: [address] },
          { contract, functionName: 'totalSupply' },
        ]),
        price: addCallGroup(chainId, token ? getLPPriceCalls(token, chainProvider) : []),
        subBalances: addCallGroup(chainId, token ? getLPBalancesCalls(token, chainProvider) : []),
      };
    });
    const idleDolaGroups = FEDS.map(lpFed => {
      if (!lpFed.incomeSrcAd) {
        return null;
      }
      const chainId = lpFed.incomeChainId || lpFed.chainId;
      const dolaContract = new Contract(getToken(CHAIN_TOKENS[chainId], 'DOLA').address!, DOLA_ABI, getChainProvider(chainId));
      return addCallGroup(chainId, [{ contract: dolaContract, functionName: 'balanceOf', params: [lpFed.incomeSrcAd] }]);
    });
    const minterRightsGroup = addCallGroup(NetworkIds.mainnet, FEDS.map(fed => ({
      contract: new Contract(DOLA, DOLA_ABI, provider),
      functionName: 'minters',
      params: [fed.address],
      fallbackValue: true,
    })));

    const [
      _fedsData,
      frontierData,
      firmTvlData,
      firmMarketsData,
      _multisigData,
      lpRewards,
      callGroupsOutputs,
    ] = await Promise.all([
      getCacheFromRedis(cacheFedDataKey, false),
      getCacheFromRedis(frontierMarketsCacheKey, false),
      getCacheFromRedis(firmTvlCacheKey, false),
      getCacheFromRedis(F2_MARKETS_CACHE_KEY, false),
      getCacheFromRedis(cacheMultisigDataKey, false),
      Promise.all(
        FEDS.map(lpFed => {
          if (!lpFed.strategy?.rewardPools?.length > 0) {
            return new Promise((res) => res([]));
          }
          // TEMP fix
          // const chainId = lpFed.incomeChainId || lpFed.chainId;
          // const address = lpFed.incomeSrcAd || lpFed.address;
          // const chainProvider = getProvider(chainId);
          // return getPoolRewards(lpFed.strategy?.rewardPools, address, chainId, chainProvider);
        })
      ),
      getCallGroupsOutputs(callGroups, getChainProvider),
    ]);

    // a failing call makes the api return the last cached results, except for the lp prices, lp balances and custom borrows
    const getRequiredOutputs = (groupIndex: number) => {
      const outputs = callGroupsOutputs[groupIndex];
      if (outputs.some(output => output === null || output === undefined)) {
        throw new Error('fed-overview: a required call failed');
      }
      return outputs;
    }

    const [anDolaBorrows] = getRequiredOutputs(anDolaBorrowsGroup);
    const fuseDolaBorrowsBn = getRequiredOutputs(fuseBorrowsGroup);
    const otherCrossFedBorrows = OTHER_FEDS.map((fed, i) => {
      if (!fed.borrowConfig?.customFunction) {
        return getRequiredOutputs(otherFedsBorrowsGroups[i])[0];
      }
      const outputs = callGroupsOutputs[otherFedsBorrowsGroups[i]];
      try {
        return outputs.some(output => output === null || output === undefined) ? BigNumber.from(0) : fed.borrowConfig.customFunction(outputs);
      } catch (e) {
        console.error(e);
        return BigNumber.from(0);
      }
    });
    const lpBalancesBn = lpFedsGroups.map(lpFedGroups => lpFedGroups ? getRequiredOutputs(lpFedGroups.balanceAndSupply)[0] : BigNumber.from('0'));
    const lpSupplyBn = lpFedsGroups.map(lpFedGroups => lpFedGroups ? getRequiredOutputs(lpFedGroups.balanceAndSupply)[1] : 0);
    const lpPrices = lpFedsGroups.map(lpFedGroups => {
      return lpFedGroups?.token ? computeLPPrice(lpFedGroups.token, lpFedGroups.chainId, callGroupsOutputs[lpFedGroups.price], prices) : 0;
    });
    const lpSubBalances = lpFedsGroups.map(lpFedGroups => {
      return lpFedGroups?.token ? computeLPBalances(lpFedGroups.token, lpFedGroups.chainId, callGroupsOutputs[lpFedGroups.subBalances]) : [];
    });
    const idleDolaBalances = idleDolaGroups.map(groupIndex => groupIndex !== null ? getRequiredOutputs(groupIndex)[0] : BigNumber.from('0'));
    const minterRights = callGroupsOutputs[minterRightsGroup];

    const fedsData = _fedsData || [];
    const frontierMarkets = frontierData?.markets || [];
    const firmMarkets = firmMarketsData?.markets || [];
    const firmTotalTvl = firmTvlData?.firmTotalTvl || 0;
    const multisigData = _multisigData || [];

    const fedOverviews = FEDS.map((fedConfig, fedIndex) => {
      const fedData = fedsData.find(f => f.address === fedConfig.address);
      let tvl, borrows, lpBalance, lpPrice, lpTotalSupply, lpPol = 0;
      let subBalances, rewards, relatedFunds = [];
      let detailsLink, detailsLinkName = '';
      // frontier
      if (fedConfig.address === '0x5E075E40D01c82B6Bf0B0ecdb4Eb1D6984357EF7') {
        const market = frontierMarkets.find(m => m.underlying.symbol === 'DOLA')
        tvl = market?.supplied || 0;
        borrows = getBnToNumber(anDolaBorrows);
        detailsLink = 'https://lookerstudio.google.com/embed/u/0/reporting/cb58a483-78a0-4f08-9625-25ea42a2bd12/page/p_e7r2kvhhtc'
        detailsLinkName = 'Analytics'
      } else if (fedConfig.isFirm) {
        tvl = firmTotalTvl;
        borrows = firmMarkets.reduce((prev, curr) => prev + curr.totalDebt, 0);
        detailsLink = 'https://firm.inverse.finance/stats#positions';
        detailsLinkName = 'Positions'
      } else if (fedConfig.type === FedTypes.LP) {
        detailsLink = `https://debank.com/profile/${fedConfig.incomeSrcAd || fedConfig.address}`;
        detailsLinkName = 'Debank'
        lpBalance = getBnToNumber(lpBalancesBn[fedIndex]);
        const _supply = getBnToNumber(lpSupplyBn[fedIndex]);
        lpPrice = lpPrices[fedIndex];
        subBalances = lpSubBalances[fedIndex];
        // we don't use the totalSupply value for composable metapools
        lpTotalSupply = fedConfig.strategy?.isComposableMetapool ?
          subBalances.reduce((prev, curr) => prev + curr.balance, 0)
          : _supply;
        lpPol = lpTotalSupply > 0 ? lpBalance / _supply : 0;
        rewards = lpRewards[fedIndex]
        if (fedConfig.strategy?.multisig) {
          const _multisig = multisigData.find(m => m.address === fedConfig.strategy.multisig.address);
          if (_multisig) {
            relatedFunds = _multisig.funds.filter(f => f.balance > 0.1 && fedConfig.strategy.multisig.relevantAssets.includes(f.token.address));
          }
        }
      } else if (fedConfig.fusePool) {
        detailsLink = `https://app.rari.capital/fuse/pool/${fedConfig.fusePool}/info`;
        detailsLinkName = 'Fuse'
        const fuseFedIndex = FUSE_FEDS.findIndex(ff => ff.fedAddress === fedConfig.address);
        if (fuseFedIndex !== -1) {
          borrows = getBnToNumber(fuseDolaBorrowsBn[fuseFedIndex]);
        }
      }
      else if (fedConfig.borrowConfig) {
        detailsLink = `https://debank.com/profile/${fedConfig.address}`;
        detailsLinkName = 'Debank';
        const index = OTHER_FEDS.findIndex(ff => ff.address === fedConfig.address);
        borrows = getBnToNumber(otherCrossFedBorrows[index]);
      }

      const supply = fedData?.supply || 0;

      return {
        ...fedConfig,
        canMintDola: minterRights[fedIndex] || false,
        abi: undefined,
        supply,
        circSupply: ['FiRM', 'Frontier'].includes(fedConfig.protocol) || !!fedConfig.borrowConfig ? borrows : supply - getBnToNumber(idleDolaBalances[fedIndex]),
        idleDolaBalance: getBnToNumber(idleDolaBalances[fedIndex]),
        lpBalance,
        lpTotalSupply,
        lpPol,
        lpPrice,
        tvl,
        borrows,
        detailsLink,
        detailsLinkName,
        subBalances,
        rewards,
        relatedFunds,
      }
    })

    const resultData = {
      timestamp: +(new Date()),
      fedOverviews,
    }

    await redisSetWithTimestamp(fedOverviewCacheKey, resultData);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(fedOverviewCacheKey, false);
      if (cache) {
        console.log('Api call failed, returning last cache found');
        res.status(200).json(cache);
      }
    } catch (e) {
      console.error(e);
      return res.status(500);
    }
  }
}
