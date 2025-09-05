import { Contract } from 'ethers'
import 'source-map-support'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { isAddress, parseUnits } from 'ethers/lib/utils';
import { estimateBlockTimestamp } from '@app/util/misc';
import { BURN_ADDRESS } from '@app/config/constants';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { ERC20_ABI } from '@app/config/abis';
import { getEnsName } from '@app/util';

const FACTORY_ABI = [{ "inputs": [{ "internalType": "address", "name": "_token0", "type": "address" }, { "internalType": "address", "name": "_operator", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token0", "type": "address" }, { "indexed": true, "internalType": "address", "name": "token1", "type": "address" }, { "indexed": true, "internalType": "address", "name": "pair", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "feeOperator", "type": "address" }], "name": "PairCreated", "type": "event" }, { "inputs": [], "name": "MAX_PROTOCOL_FEE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "acceptPendingOperator", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "allPairs", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "allPairsLength", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "token1", "type": "address" }, { "internalType": "uint256", "name": "fee", "type": "uint256" }, { "internalType": "address", "name": "feeOperator", "type": "address" }], "name": "createPair", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "feeRecipient", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "pair", "type": "address" }], "name": "getProtocolFee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "isPair", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "operator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "pairFees", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pendingOperator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "protocolFee", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newFeeRecipient", "type": "address" }], "name": "setFeeRecipient", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "pair", "type": "address" }, { "internalType": "uint256", "name": "newFee", "type": "uint256" }], "name": "setPairFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newPending", "type": "address" }], "name": "setPendingOperator", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "newProtocolFee", "type": "uint256" }], "name": "setProtocolFee", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "token0", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }];
const PAIR_ABI = [
  "function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)",
  "function getCurrentToken1EmaPrice() public view returns (uint256)",
  "function feesUnclaimedTotal0() public view returns (uint256)",
  "function protocolFeesUnclaimed0() public view returns (uint256)",
  "function operatorFeesUnclaimed0() public view returns (uint256)",
  "function fee() public view returns (uint256)",
];

export default async function handler(req, res) {
  const cacheDuration = 60;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);
  const { chainId, factory, cacheFirst } = req.query;
  if (!['1', '11155111'].includes(chainId) || !factory || factory === BURN_ADDRESS || (!!factory && !isAddress(factory))) {
    return res.status(400).json({ success: false, error: 'Invalid factory address' });
  }
  const cacheKey = `amm-deployments-${chainId}-${factory}-v1.0.4`;
  try {
    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getPaidProvider(Number(chainId || 1));
    const eventsProvider = getPaidProvider(Number(chainId || 1));

    const factoryContract = new Contract(factory, FACTORY_ABI, eventsProvider);
    const lastBlock = cachedData?.deployedEvents?.length ? cachedData?.deployedEvents[cachedData.deployedEvents.length - 1].blockNumber : undefined;

    let events: any[] = [];

    const [block] = await Promise.all([
      provider.getBlock('latest'),
    ]);

    const currentBlock = block.number;
    const now = block.timestamp * 1000;

    try {
      events = await factoryContract.queryFilter(factoryContract.filters.PairCreated(), lastBlock ? lastBlock + 1 : undefined, currentBlock);
    } catch (e) {
      console.log('e', e);
    }

    const cachedEvents = cachedData?.deployedEvents || [];
    const cachedDeployments = cachedData?.deployments || [];

    const newEvents = events.map(e => {
      const token0 = e.args?.token0;
      const token1 = e.args?.token1;
      const pair = e.args?.pair;
      const fee = e.args?.fee;
      const feeOperator = e.args?.feeOperator;
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(e.blockNumber, now, currentBlock),
        token0,
        token1,
        coin: token0,
        collateral: token1,
        pair,
        feePerc: getBnToNumber(fee, 2),
        feeBps: getBnToNumber(fee, 0),
        feeOperator,
        operator: feeOperator,
      }
    });

    const [
      reserves,
      prices,
      feesUnclaimedTotal0,
      protocolFeesUnclaimed0,
      operatorFeesUnclaimed0,
      fee,
      token0Balance,
      token1Balance,
    ] = await getGroupedMulticallOutputs(
      [
        newEvents.map(e => {
          return { contract: new Contract(e.pair, PAIR_ABI, provider), functionName: 'getReserves' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.pair, PAIR_ABI, provider), functionName: 'getCurrentToken1EmaPrice' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.pair, PAIR_ABI, provider), functionName: 'feesUnclaimedTotal0' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.pair, PAIR_ABI, provider), functionName: 'protocolFeesUnclaimed0' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.pair, PAIR_ABI, provider), functionName: 'operatorFeesUnclaimed0' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.pair, PAIR_ABI, provider), functionName: 'fee' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.token0, ERC20_ABI, provider), functionName: 'balanceOf', params: [e.pair] }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.token1, ERC20_ABI, provider), functionName: 'balanceOf', params: [e.pair] }
        }),
      ],
      Number(chainId),
      currentBlock,
      provider,
    );

    const deployedEvents = cachedEvents.concat(newEvents);

    const deployments = cachedDeployments
      .concat(
        newEvents.map((e, i) => {
          return {
            id: i + cachedDeployments.length,
            ...e,
          }
        })
      );

    const [
      coinSymbol,
      coinName,
      coinDecimals,
      collateralSymbol,
      collateralName,
      collateralDecimals,
    ] = await getGroupedMulticallOutputs(
      [
        deployments.map(e => {
          return { contract: new Contract(e.token0, ERC20_ABI, provider), functionName: 'symbol', forceFallback: !!e.coinSymbol, fallbackValue: e.coinSymbol }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.token0, ERC20_ABI, provider), functionName: 'name', forceFallback: !!e.coinName, fallbackValue: e.coinName }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.token0, ERC20_ABI, provider), functionName: 'decimals', forceFallback: !!e.coinDecimals, fallbackValue: e.coinDecimals ? parseUnits(e.coinDecimals.toString(), 0) : undefined }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.token1, ERC20_ABI, provider), functionName: 'symbol', forceFallback: !!e.collateralSymbol, fallbackValue: e.collateralSymbol }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.token1, ERC20_ABI, provider), functionName: 'name', forceFallback: !!e.collateralName, fallbackValue: e.collateralName }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.token1, ERC20_ABI, provider), functionName: 'decimals', forceFallback: !!e.collateralDecimals, fallbackValue: e.collateralDecimals ? parseUnits(e.collateralDecimals.toString(), 0) : undefined }
        }),
      ],
      Number(chainId),
      currentBlock,
      provider,
    );

    deployments.forEach((e, i) => {
      e.coinSymbol = coinSymbol[i];
      e.coinName = coinName[i];
      e.coinDecimals = getBnToNumber(coinDecimals[i], 0);
      e.collateralSymbol = collateralSymbol[i];
      e.collateralName = collateralName[i];
      e.collateralDecimals = getBnToNumber(collateralDecimals[i], 0);
      e.reserve0 = getBnToNumber(reserves[i][0], coinDecimals);
      e.reserve1 = getBnToNumber(reserves[i][1], collateralDecimals);
      e.price = getBnToNumber(prices[i], 18);
      e.feesUnclaimedTotal0 = getBnToNumber(feesUnclaimedTotal0[i], coinDecimals);
      e.protocolFeesUnclaimed0 = getBnToNumber(protocolFeesUnclaimed0[i], coinDecimals);
      e.operatorFeesUnclaimed0 = getBnToNumber(operatorFeesUnclaimed0[i], coinDecimals);
      e.pairFeePerc = getBnToNumber(fee[i], 2);
      e.pairFeeBps = getBnToNumber(fee[i], 0);
      e.token0Balance = getBnToNumber(token0Balance[i], coinDecimals);
      e.token1Balance = getBnToNumber(token1Balance[i], collateralDecimals);
      e.reserveTimestampLast = getBnToNumber(reserves[i][2], 0) * 1000;
      e.name = `${e.coinSymbol}-${e.collateralSymbol}`;
    });

    const disctinctOperators = [...new Set(deployments.map(e => e.feeOperator.toLowerCase()))];

    const ensNames = await Promise.all(disctinctOperators.map(op => {
      return getEnsName(op, true, getProvider(1));
    }));

    deployments.forEach((e, i) => {
      const distinctIndex = disctinctOperators.indexOf(e.feeOperator.toLowerCase());
      e.operatorEnsName = ensNames[distinctIndex] || '';
    });

    const resultData = {
      timestamp: now,
      deployments,
      deployedEvents,
    }

    await redisSetWithTimestamp(cacheKey, resultData, false);

    res.status(200).json(resultData)
  } catch (err) {
    console.error(err);
    // if an error occured, try to return last cached results
    try {
      const cache = await getCacheFromRedis(cacheKey, false, 0, false);
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