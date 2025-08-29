import { BigNumber, Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI, ERC20_ABI, F2_ALE_ABI, F2_ESCROW_ABI, F2_MARKET_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber, getToken } from '@app/util/markets'
import { ALE_V2, BLOCKS_PER_DAY, BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps } from '@app/util/timestamps';
import { ascendingEventsSorter, throttledPromises } from '@app/util/misc';
import { CHAIN_TOKENS, TOKENS } from '@app/variables/tokens';
import { isAddress } from 'ethers/lib/utils';
import { formatFirmEvents } from '@app/util/f2';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { FEATURE_FLAGS } from '@app/config/features';

const { F2_MARKETS, DBR, F2_ALE, F2_HELPER } = getNetworkConfigConstants();

export default async function handler(req, res) {
  const { cacheFirst, account, escrow, market, firmActionIndex } = req.query;
  if (
    !account || !isAddress(account) || isInvalidGenericParam(account)
    || !market || !isAddress(market) || isInvalidGenericParam(market)
    || !escrow || !isAddress(escrow) || isInvalidGenericParam(escrow)
    || isInvalidGenericParam(firmActionIndex)
  ) {
    res.status(400).json({ msg: 'invalid request' });
    return;
  }
  const cacheKey = `firm-position-leverage-level-${escrow}-${CHAIN_ID}-v1.0.0`;
  try {
    const webCacheDuration = 3600;
    const redisCacheDuration = 60;
    res.setHeader('Cache-Control', `public, max-age=${webCacheDuration}`);
    const { data: archivedData, isValid } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', redisCacheDuration);
    if (isValid && (firmActionIndex === archivedData.firmActionIndex || cacheFirst === 'true')) {
      res.status(200).json(archivedData);
      return
    }

    // not using fallbackprovider because it's not working with call & blockNumber
    const provider = getProvider(CHAIN_ID);
    const eventsProvider = getPaidProvider(CHAIN_ID);
    const _market = F2_MARKETS.find(m => m.address === market);
    _market.underlying = TOKENS[_market.collateral];

    if (!_market) {
      res.status(404).json({ success: false });
      return;
    }

    const currentBlock = await provider.getBlockNumber();
    const marketContract = new Contract(_market.address, F2_MARKET_ABI, eventsProvider);
    const aleContractV2 = new Contract(ALE_V2, F2_ALE_ABI, eventsProvider);
    // current
    const aleContract = new Contract(F2_ALE, F2_ALE_ABI, eventsProvider);
    const aleMarketData = await aleContract.markets(_market.address);
    const hasAleFeature = FEATURE_FLAGS.firmLeverage && aleMarketData[0] !== BURN_ADDRESS;
    const escrowCreations = await marketContract.queryFilter(marketContract.filters.CreateEscrow(account), _market.startingBlock);
    const escrowCreationBlock = escrowCreations.length > 0 ? escrowCreations[0].blockNumber : 0;

    if (!escrowCreationBlock) {
      res.status(400).json({ success: false, msg: 'no escrow' });
      return;
    }

    const archived = archivedData || { lastArchivedBlock: 0, balance: 0, debt: 0, leverageLevel: 0 };
    const startingBlock = (archived?.lastArchivedBlock ? archived?.lastArchivedBlock + 1 : undefined);

    const collateralContract = new Contract(_market.collateral, ERC20_ABI, eventsProvider);

    const userTransfers = [
      collateralContract.queryFilter(collateralContract.filters.Transfer(account), startingBlock),
    ];

    // faster than multiple queryFilters
    const relevantTransfersDestinations = [
      escrow,
      marketContract.address,
      aleContract.address,
      aleContractV2.address,
      F2_HELPER,
    ].map(a => a.toLowerCase());

    const transferQueryResults = await Promise.all(userTransfers);
    const flatenedTransferEvents = transferQueryResults.flat()
      .filter(e => relevantTransfersDestinations.includes(e.args?.to?.toLowerCase()))
      .sort(ascendingEventsSorter);

    const totalUserDeposits = getBnToNumber(flatenedTransferEvents.reduce((acc, e) => acc.add(e.args?.amount || 0), BigNumber.from(0)));

    const escrowContract = new Contract(escrow, F2_ESCROW_ABI, provider);

    const balanceFunctionName = 'balance';
    const debtFunctionName = 'debts';

    const decimals = getToken(CHAIN_TOKENS[CHAIN_ID], _market.collateral).decimals;

    const positionData = await getGroupedMulticallOutputs([
      { contract: escrowContract, functionName: balanceFunctionName },
      { contract: marketContract, functionName: debtFunctionName, params: [account], fallbackValue: BigNumber.from(0) },
    ], Number(CHAIN_ID));

    const balance = getBnToNumber(positionData[0], decimals);
    const debt = getBnToNumber(positionData[1]);

    const resultData = {
      timestamp: Date.now(),
      totalUserDeposits,
      leverageLevel: totalUserDeposits ? balance / totalUserDeposits : 0,
      debt,
      balance,
      flatenedTransferEvents,
    }

    // await redisSetWithTimestamp(cacheKey, resultData);

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