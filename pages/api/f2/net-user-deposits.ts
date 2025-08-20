import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { ERC20_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { ALE_V2, CHAIN_ID } from '@app/config/constants';
import { isAddress } from 'ethers/lib/utils';
import { inverseViewer } from '@app/util/viewer';

const { F2_MARKETS, F2_ALE, F2_HELPER, DOLA } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account } = req.query;
  if (
    !account || !isAddress(account) || isInvalidGenericParam(account)
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const cacheKey = `firm-net-user-deposits-${account}-v1.0.2`;
  try {
    const webCacheDuration = 60;
    const redisCacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${webCacheDuration}`);
    const { data: archivedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', redisCacheDuration);

    if (isValid && cacheFirst === 'true') {
      res.status(200).json(archivedData);
      return
    }

    const provider = getProvider(CHAIN_ID);

    const currentBlock = await provider.getBlockNumber();
    const lastCheckedBlock = archivedData?.lastCheckedBlock || undefined;
    const startBlock = lastCheckedBlock ? lastCheckedBlock + 1 : undefined;
    const endBlock = currentBlock;

    const deltaBlocks = startBlock ? currentBlock - startBlock : currentBlock;
    // Infura if more than 10k blocks, otherwise alchemy is fine
    const eventsProvider = deltaBlocks > 10_000 ? getPaidProvider(CHAIN_ID) : provider;

    const ifv = inverseViewer(provider);
    const marketsAndPositions = await ifv.firm.getMarketListForAccountBreakdown(F2_MARKETS.map(m => m.address), account);
    const userActivePositions = marketsAndPositions.positions.filter(p => p.collateralValue >= 1);

    const commonDestinations = [
      ALE_V2,
      F2_ALE,
      F2_HELPER,
    ].map(a => a.toLowerCase());

    const relevantDestinationsPerMarket = {};
    const dolaContract = new Contract(DOLA, ERC20_ABI, eventsProvider);

    const userTransfersPerMarketQueries = userActivePositions.map(position => {
      relevantDestinationsPerMarket[position.market] = [
        ...commonDestinations,
        position.escrow.toLowerCase(),
        position.market.toLowerCase(),
      ];
      const collateral = marketsAndPositions.markets.find(m => m.market === position.market).collateral;
      const contract = new Contract(collateral, ERC20_ABI, eventsProvider);
      const queries = [
        contract.queryFilter(contract.filters.Transfer(account, undefined), startBlock, endBlock),
        contract.queryFilter(contract.filters.Transfer(undefined, account), startBlock, endBlock),
      ];
      const marketConfig = F2_MARKETS.find(m => m.address?.toLowerCase() === position.market.toLowerCase());
      if (marketConfig?.aleTransformerType === 'marketAddressAndAmount' && marketConfig.oracleType === 'chainlink+CurveLP') {
        // leverage with initial deposit via DOLA (lp market only)
        queries.push(dolaContract.queryFilter(dolaContract.filters.Transfer(account, F2_ALE), startBlock, endBlock));
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

    const resultsPerMarket = userActivePositions.map((position, index) => {
      const marketConfig = F2_MARKETS.find(m => m.address?.toLowerCase() === position.market.toLowerCase());
      const marketData = marketsAndPositions.markets.find(m => m.market?.toLowerCase() === position.market.toLowerCase());

      const isMarketAcceptsDolaAsDeposit = marketConfig?.aleTransformerType === 'marketAddressAndAmount' && marketConfig.oracleType === 'chainlink+CurveLP';

      const transfers = userTransfersPerMarketResults[index * 3]
        .concat(userTransfersPerMarketResults[index * 3 + 1]);

      const dolaDepositsTransfers = userTransfersPerMarketResults[index * 3 + 2];

      const relevantTransfersDestinations = relevantDestinationsPerMarket[position.market] || [];

      const depositsTxs = transfers.filter(e => e.args[0]?.toLowerCase() === accountLc && relevantTransfersDestinations.includes(e.args[1]?.toLowerCase()))
      const deposits = getBnToNumber(depositsTxs.reduce((acc, e) => acc.add(e.args[2] || 0), BigNumber.from(0)));
      // approximation
      const depositsComingFromDola = getBnToNumber(dolaDepositsTransfers.filter(e => e.args[0]?.toLowerCase() === accountLc && e.args[1]?.toLowerCase() === F2_ALE)
        .reduce((acc, e) => acc.add(e.args[2] || 0), BigNumber.from(0))) / (marketData.price || 1);


      const withdrawalsTxs = transfers.filter(e => e.args[1]?.toLowerCase() === accountLc && relevantTransfersDestinations.includes(e.args[0]?.toLowerCase()))
      const withdrawals = getBnToNumber(withdrawalsTxs.reduce((acc, e) => acc.add(e.args[2] || 0), BigNumber.from(0)));

      const totalDeposits = deposits + depositsComingFromDola;

      const netDeposits = Math.max(0, totalDeposits - withdrawals);

      const cachedMarketUserData = archivedData?.userDepositsPerMarket?.[position.market] || {
        deposits: 0,
        withdrawals: 0,
        netDeposits: 0,
        transfersLength: 0,
        depositsTxs: 0,
        withdrawalsTxs: 0,
      };

      return {
        market: position.market,
        deposits: cachedMarketUserData.deposits + totalDeposits,
        withdrawals: cachedMarketUserData.withdrawals + withdrawals,
        netDeposits: cachedMarketUserData.netDeposits + netDeposits,
        transfersLength: cachedMarketUserData.transfersLength + transfers.length,
        depositsTxs: cachedMarketUserData.depositsTxs + depositsTxs.length,
        withdrawalsTxs: cachedMarketUserData.withdrawalsTxs + withdrawalsTxs.length,
      }
    });

    const resultData = {
      timestamp: Date.now(),
      lastCheckedBlock: endBlock,
      // past markets are not included, the net deposits will start from 0 if the user exited a market
      userDepositsPerMarket: resultsPerMarket.reduce((acc, curr) => {
        acc[curr.market] = curr;
        return acc;
      }, {}),
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