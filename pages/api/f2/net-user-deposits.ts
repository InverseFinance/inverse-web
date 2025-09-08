import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI, ERC20_ABI, F2_ALE_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { ALE_V2, BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { isAddress } from 'ethers/lib/utils';
import { formatAccountAndMarketListBreakdown, inverseViewer } from '@app/util/viewer';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { getLargeLogs } from '@app/util/web3';

const { F2_MARKETS, F2_ALE, F2_HELPER, DOLA, DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account, market } = req.query;
  if (
    !account || !isAddress(account) || isInvalidGenericParam(account)
    || (market && !F2_MARKETS.find(m => m.address?.toLowerCase() === market?.toLowerCase()))
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const cacheKey = `firm-net-user-deposits-${account}-v1.0.8`;
  try {
    const webCacheDuration = 60;
    const redisCacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${webCacheDuration}`);
    const { data: archivedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', redisCacheDuration);

    if (isValid || (!!archivedData && cacheFirst === 'true') || !market) {
      res.status(200).json(archivedData || {});
      return
    }

    const provider = getProvider(CHAIN_ID);
    const dbrContract = new Contract(DBR, DBR_ABI, provider);
    const dbrLastUpdated = getBnToNumber(await dbrContract.lastUpdated(account), 0);
    // => means no change in net deposits, skip re-fetching
    if (archivedData?.dbrLastUpdated === dbrLastUpdated && !market || (!!market && !!archivedData?.userDepositsPerMarket?.[market])) {
      res.status(200).json(archivedData);
      return;
    }

    const currentBlock = await provider.getBlockNumber();
    const queryMarketConfig = F2_MARKETS.find(m => m.address?.toLowerCase() === market.toLowerCase());
    const lastCheckedBlock = market ? archivedData?.userDepositsPerMarket?.[market]?.lastCheckedBlock : archivedData?.lastCheckedBlock || undefined;
    const startBlock = lastCheckedBlock ? lastCheckedBlock + 1 : market ? queryMarketConfig?.startingBlock : undefined;
    const endBlock = currentBlock;

    const deltaBlocks = startBlock ? currentBlock - startBlock : currentBlock;
    const isLargeCase = deltaBlocks > 100_000;
    // Infura if more than 10k blocks, otherwise alchemy is fine
    const eventsProvider = deltaBlocks > 500 ? getPaidProvider(CHAIN_ID) : provider;

    const ifv = inverseViewer(provider);
    const currentAleContract = new Contract(F2_ALE, F2_ALE_ABI, provider);

    const [
      marketsAndPositionsRaw,
      marketsAleDataRaw,
    ] = await getGroupedMulticallOutputs([
      {
        contract: ifv.firmContract, functionName: 'getMarketListForAccountBreakdown', params: [
          market ? [market] : F2_MARKETS.map(m => m.address),
          account,
        ], fallbackValue: []
      },
      F2_MARKETS.map(m => {
        return {
          contract: currentAleContract,
          functionName: 'markets',
          params: [m.address],
        }
      }),
    ], Number(CHAIN_ID));

    const marketsAndPositions = formatAccountAndMarketListBreakdown(marketsAndPositionsRaw);

    const userActivePositions = marketsAndPositions.positions.filter(p => p.collateralValue >= 1);

    const commonDestinations = [
      ALE_V2,
      F2_ALE,
      F2_HELPER,
    ].map(a => a.toLowerCase());

    const relevantDestinationsPerMarket = {};
    const aleContractForEvents = new Contract(F2_ALE, F2_ALE_ABI, eventsProvider);

    const userTransfersPerMarketQueries = userActivePositions.map(position => {
      relevantDestinationsPerMarket[position.market] = [
        ...commonDestinations,
        position.escrow.toLowerCase(),
        position.market.toLowerCase(),
      ];
      const collateral = marketsAndPositions.markets.find(m => m.market === position.market).collateral;
      const contract = new Contract(collateral, ERC20_ABI, eventsProvider);
      const marketContract = new Contract(position.market, F2_MARKET_ABI, eventsProvider);

      const aleConfigIndex = F2_MARKETS.findIndex(m => m.address?.toLowerCase() === position.market.toLowerCase());
      const aleConfig = marketsAleDataRaw[aleConfigIndex];

      let queries = [];

      // if(isLargeCase) {
      //   queries = [
      //     getLargeLogs(contract, contract.filters.Transfer(account, undefined), startBlock, endBlock, 10_000),
      //     getLargeLogs(contract, contract.filters.Transfer(undefined, account), startBlock, endBlock, 10_000),
      //     getLargeLogs(marketContract, marketContract.filters.Liquidate(account), startBlock, endBlock, 10_000),
      //   ]
      // } else {
      queries = [
        contract.queryFilter(contract.filters.Transfer(account, undefined), startBlock, endBlock),
        contract.queryFilter(contract.filters.Transfer(undefined, account), startBlock, endBlock),
        marketContract.queryFilter(marketContract.filters.Liquidate(account), startBlock, endBlock),
      ];
      // }

      if (aleConfig.buySellToken !== BURN_ADDRESS && aleConfig.buySellToken.toLowerCase() !== collateral.toLowerCase()) {
        // initial deposit with DOLA
        // if (aleConfig.buySellToken.toLowerCase() === DOLA.toLowerCase()) {
        queries.push(aleContractForEvents.queryFilter(aleContractForEvents.filters.Deposit(position.market, account, DOLA), startBlock, endBlock));
        // } // leverage with initial deposit different than collateral and 
        // else {
        // const alternativeDepositTokenContract = new Contract(aleConfig.buySellToken, ERC20_ABI, eventsProvider);
        // queries.push(alternativeDepositTokenContract.queryFilter(alternativeDepositTokenContract.filters.Transfer(account), startBlock, endBlock));
        // }
      } else {
        queries.push(
          new Promise(resolve => {
            resolve([])
          })
        );
      }
      return queries;
    }).flat();

    const accountLc = account.toLowerCase();

    const userTransfersPerMarketResults = await Promise.all(userTransfersPerMarketQueries);
    // const userTransfersPerMarketResults = await Promise.all(
    //   userTransfersPerMarketQueries.map(query => {
    //     return getLargeLogs(
    //       dbrContract,
    //       dbrContract.filters.ForceReplenish(account || undefined),
    //       lastBlock ? lastBlock+1 : currentBlock - 50_000,
    //       currentBlock,
    //       10_000,
    //     );
    //   })
    // );
    // const userTransfersPerMarketResponses = await Promise.allSettled(userTransfersPerMarketQueries);
    // const userTransfersPerMarketResults = userTransfersPerMarketResponses
    //   .map(r => r.status === 'fulfilled' ? r.value : []);

    // return res.status(200).json({
    //   errors: userTransfersPerMarketResponses.map((r,i) => r.status === 'rejected' ? {
    //     query: userTransfersPerMarketQueries[i],
    //     error: r.reason,
    //   } : null),
    // });

    const resultsPerMarket = userActivePositions.map((position, index) => {
      const marketConfig = F2_MARKETS.find(m => m.address?.toLowerCase() === position.market.toLowerCase());
      const aleConfigIndex = F2_MARKETS.findIndex(m => m.address?.toLowerCase() === position.market.toLowerCase());
      const aleConfig = marketsAleDataRaw[aleConfigIndex];

      const marketData = marketsAndPositions.markets.find(m => m.market?.toLowerCase() === position.market.toLowerCase());

      const transfers = userTransfersPerMarketResults[index * 4]
        .concat(userTransfersPerMarketResults[index * 4 + 1]);

      const liquidationsTxs = userTransfersPerMarketResults[index * 4 + 2];
      const liquidated = getBnToNumber(liquidationsTxs.reduce((acc, e) => acc.add(e.args[3] || 0), BigNumber.from(0)));

      const alternativeTokenTransfers = userTransfersPerMarketResults[index * 4 + 3];

      const relevantTransfersDestinations = relevantDestinationsPerMarket[position.market] || [];

      const depositsTxs = transfers.filter(e => e.args[0]?.toLowerCase() === accountLc && relevantTransfersDestinations.includes(e.args[1]?.toLowerCase()))
      const deposits = getBnToNumber(depositsTxs.reduce((acc, e) => acc.add(e.args[2] || 0), BigNumber.from(0)));
      // approximation

      const depositsComingFromAlternativeToken = getBnToNumber(alternativeTokenTransfers
        .reduce((acc, e) => acc.add(e.args[3] || 0), BigNumber.from(0))) / (marketData.price || 1);

      const withdrawalsTxs = transfers.filter(e => e.args[1]?.toLowerCase() === accountLc && relevantTransfersDestinations.includes(e.args[0]?.toLowerCase()))
      const withdrawals = getBnToNumber(withdrawalsTxs.reduce((acc, e) => acc.add(e.args[2] || 0), BigNumber.from(0)));

      const totalDeposits = deposits + depositsComingFromAlternativeToken;

      const netDeposits = Math.max(0, totalDeposits - withdrawals - liquidated);

      const cachedMarketUserData = archivedData?.userDepositsPerMarket?.[position.market] || {
        deposits: 0,
        withdrawals: 0,
        liquidated: 0,
        netDeposits: 0,
        transfersLength: 0,
        nbDepositsTxs: 0,
        nbWithdrawalsTxs: 0,
        nbAltDepositsTxs: 0,
        nbLiquidationsTxs: 0,
      };

      return {
        name: marketConfig.name,
        market: position.market,
        lastCheckedBlock: endBlock,
        collateral: marketData.collateral,
        buySellToken: aleConfig.buySellToken,
        liquidated: cachedMarketUserData.liquidated + liquidated,
        deposits: cachedMarketUserData.deposits + totalDeposits,
        withdrawals: cachedMarketUserData.withdrawals + withdrawals,
        netDeposits: cachedMarketUserData.netDeposits + netDeposits,
        transfersLength: cachedMarketUserData.transfersLength + transfers.length,
        nbDepositsTxs: cachedMarketUserData.nbDepositsTxs + depositsTxs.length,
        nbWithdrawalsTxs: cachedMarketUserData.nbWithdrawalsTxs + withdrawalsTxs.length,
        nbAltDepositsTxs: cachedMarketUserData.nbAltDepositsTxs + alternativeTokenTransfers.length,
        nbLiquidationsTxs: cachedMarketUserData.nbLiquidationsTxs + liquidationsTxs.length,
      }
    });

    const resultData = {
      timestamp: Date.now(),
      dbrLastUpdated,
      lastCheckedBlock: endBlock,
      // past markets are not included, the net deposits will start from 0 if the user exited a market
      userDepositsPerMarket: resultsPerMarket.reduce((acc, curr) => {
        acc[curr.market] = curr;
        return acc;
      }, archivedData?.userDepositsPerMarket || {}),
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