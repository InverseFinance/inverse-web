import { Contract } from 'ethers'
import 'source-map-support'
import { getPaidProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { aprToApy, getBnToNumber, getNumberToBn } from '@app/util/markets'
import { isAddress, parseUnits } from 'ethers/lib/utils';
import { estimateBlockTimestamp } from '@app/util/misc';
import { LENDER_ABI, monolithSupportedChainIds } from './positions';
import { BLOCKS_PER_YEAR, BURN_ADDRESS } from '@app/config/constants';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { ERC20_ABI, SVAULT_ABI } from '@app/config/abis';

const FACTORY_ABI = [{ "type": "constructor", "inputs": [{ "name": "_operator", "type": "address", "internalType": "address" }], "stateMutability": "nonpayable" }, { "type": "function", "name": "MAX_FEE_BPS", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "acceptOperator", "inputs": [], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "customFeeBps", "inputs": [{ "name": "", "type": "address", "internalType": "address" }], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "deploy", "inputs": [{ "name": "_name", "type": "string", "internalType": "string" }, { "name": "_symbol", "type": "string", "internalType": "string" }, { "name": "_collateral", "type": "address", "internalType": "address" }, { "name": "_feed", "type": "address", "internalType": "address" }, { "name": "_collateralFactor", "type": "uint256", "internalType": "uint256" }, { "name": "_minDebt", "type": "uint256", "internalType": "uint256" }, { "name": "_timeUntilImmutability", "type": "uint256", "internalType": "uint256" }, { "name": "_operator", "type": "address", "internalType": "address" }], "outputs": [{ "name": "lender", "type": "address", "internalType": "address" }, { "name": "coin", "type": "address", "internalType": "address" }, { "name": "vault", "type": "address", "internalType": "address" }], "stateMutability": "nonpayable" }, { "type": "function", "name": "deployments", "inputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" }, { "type": "function", "name": "deploymentsLength", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "feeBps", "inputs": [], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "feeRecipient", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" }, { "type": "function", "name": "getFeeOf", "inputs": [{ "name": "_lender", "type": "address", "internalType": "address" }], "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "interestModel", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" }, { "type": "function", "name": "isDeployed", "inputs": [{ "name": "", "type": "address", "internalType": "address" }], "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }], "stateMutability": "view" }, { "type": "function", "name": "operator", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" }, { "type": "function", "name": "pendingOperator", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "address" }], "stateMutability": "view" }, { "type": "function", "name": "pullReserves", "inputs": [{ "name": "_deployment", "type": "address", "internalType": "address" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "setCustomFeeBps", "inputs": [{ "name": "_address", "type": "address", "internalType": "address" }, { "name": "_feeBps", "type": "uint256", "internalType": "uint256" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "setFeeBps", "inputs": [{ "name": "_feeBps", "type": "uint256", "internalType": "uint256" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "setFeeRecipient", "inputs": [{ "name": "_feeRecipient", "type": "address", "internalType": "address" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "function", "name": "setPendingOperator", "inputs": [{ "name": "_pendingOperator", "type": "address", "internalType": "address" }], "outputs": [], "stateMutability": "nonpayable" }, { "type": "event", "name": "CustomFeeBpsSet", "inputs": [{ "name": "lender", "type": "address", "indexed": true, "internalType": "address" }, { "name": "feeBps", "type": "uint256", "indexed": false, "internalType": "uint256" }], "anonymous": false }, { "type": "event", "name": "Deployed", "inputs": [{ "name": "lender", "type": "address", "indexed": true, "internalType": "address" }, { "name": "coin", "type": "address", "indexed": true, "internalType": "address" }, { "name": "vault", "type": "address", "indexed": true, "internalType": "address" }], "anonymous": false }];
const INTEREST_MODEL_ABI = [{ "type": "function", "name": "calculateInterest", "inputs": [{ "name": "_totalPaidDebt", "type": "uint256", "internalType": "uint256" }, { "name": "_lastRate", "type": "uint256", "internalType": "uint256" }, { "name": "_timeElapsed", "type": "uint256", "internalType": "uint256" }, { "name": "_expRate", "type": "uint256", "internalType": "uint256" }, { "name": "_lastFreeDebtRatioBps", "type": "uint256", "internalType": "uint256" }, { "name": "_targetFreeDebtRatioStartBps", "type": "uint256", "internalType": "uint256" }, { "name": "_targetFreeDebtRatioEndBps", "type": "uint256", "internalType": "uint256" }], "outputs": [{ "name": "currBorrowRate", "type": "uint256", "internalType": "uint256" }, { "name": "interest", "type": "uint256", "internalType": "uint256" }], "stateMutability": "pure" }]

export default async function handler(req, res) {
  const cacheDuration = 60;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);
  const { chainId, factory, cacheFirst } = req.query;
  if (!monolithSupportedChainIds.includes(chainId) || !factory || factory === BURN_ADDRESS || (!!factory && !isAddress(factory))) {
    return res.status(400).json({ success: false, error: 'Invalid factory address' });
  }
  const cacheKey = `monolith-deployments-${chainId}-${factory}-v1.0.1`;
  try {
    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getPaidProvider(Number(chainId || 1));

    const factoryContract = new Contract(factory, FACTORY_ABI, provider);
    const lastBlock = cachedData?.deployedEvents?.length ? cachedData?.deployedEvents[cachedData.deployedEvents.length - 1].blockNumber : undefined;

    let events: any[] = [];

    const [currentBlock] = await Promise.all([
      provider.getBlockNumber(),
    ]);
    const now = Date.now();

    try {
      events = await factoryContract.queryFilter(factoryContract.filters.Deployed(), lastBlock ? lastBlock + 1 : undefined, currentBlock);
    } catch (e) {
      console.log('e', e);
    }

    const cachedEvents = cachedData?.deployedEvents || [];
    const cachedDeployments = cachedData?.deployments || [];

    const newEvents = events.map(e => {
      const lender = e.args?.lender;
      const coin = e.args?.coin;
      const vault = e.args?.vault;
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(e.blockNumber, now, currentBlock),
        lender,
        coin,
        vault,
      }
    });

    // immutable state variables
    const [collaterals, collateralFactor, minDebt, interesModel, symbols, names] = await getGroupedMulticallOutputs(
      [
        newEvents.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'collateral' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'collateralFactor' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'minDebt' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'interestModel' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'symbol' }
        }),
        newEvents.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'name' }
        }),
      ],
      Number(chainId),
      currentBlock,
      provider,
    );

    const deployedEvents = cachedEvents.concat(newEvents);

    const deployments = deployedEvents.map((e, i) => {
      return {
        id: i,
        ...e,
        collateralDecimals: cachedDeployments?.[i]?.collateralDecimals || undefined,
        collateral: collaterals[i],
        collateralFactor: getBnToNumber(collateralFactor[i], 4),
        minDebt: getBnToNumber(minDebt[i], 18),
        interestModel: interesModel[i],
        symbol: symbols[i],
        name: names[i],
      }
    });

    const [
      collateralSymbol,
      collateralName,
      collateralDecimals,
      marketTotalCollateralBalance,
      priceData,
      immutabilityDeadline,
      totalPaidDebt,
      totalFreeDebt,
      totalFreeDebtShares,
      totalPaidDebtShares,
      cachedGlobalFeeBps,
      accruedLocalReserves,
      accruedGlobalReserves,
      operator,
      feeBps,
      lastAccrue,
      lastBorrowRateMantissa,
      redeemFeeBps,
      targetFreeDebtRatioStartBps,
      targetFreeDebtRatioEndBps,
      expRate,
      staked,
    ] = await getGroupedMulticallOutputs(
      [
        deployments.map(e => {
          return { contract: new Contract(e.collateral, ERC20_ABI, provider), functionName: 'symbol', forceFallback: !!e.collateralSymbol, fallbackValue: e.collateralSymbol }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.collateral, ERC20_ABI, provider), functionName: 'name', forceFallback: !!e.collateralName, fallbackValue: e.collateralName }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.collateral, ERC20_ABI, provider), functionName: 'decimals', forceFallback: !!e.collateralDecimals, fallbackValue: e.collateralDecimals ? parseUnits(e.collateralDecimals.toString(), 0) : undefined }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.collateral, ERC20_ABI, provider), functionName: 'balanceOf', params: [e.lender] }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'getCollateralPrice' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'immutabilityDeadline' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'totalPaidDebt' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'totalFreeDebt' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'totalFreeDebtShares' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'totalPaidDebtShares' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'cachedGlobalFeeBps' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'accruedLocalReserves' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'accruedGlobalReserves' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'operator' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'feeBps' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'lastAccrue' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'lastBorrowRateMantissa' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'redeemFeeBps' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'targetFreeDebtRatioStartBps' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'targetFreeDebtRatioEndBps' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.lender, LENDER_ABI, provider), functionName: 'expRate' }
        }),
        deployments.map(e => {
          return { contract: new Contract(e.vault, SVAULT_ABI, provider), functionName: 'totalAssets' }
        }),
      ],
      Number(chainId),
      currentBlock,
      provider,
    );

    deployments.forEach((e, i) => {
      const [priceBn, isReduceOnly, isLiquidationAllowed] = priceData[i];
      // always use 18 decimals for price
      const price = getBnToNumber(priceBn, 18);
      e.collateralSymbol = collateralSymbol[i];
      e.collateralName = collateralName[i];
      e.collateralDecimals = getBnToNumber(collateralDecimals[i], 0);
      e.marketTotalCollateralBalance = getBnToNumber(marketTotalCollateralBalance[i], e.collateralDecimals);
      e.price = price;
      e.tvl = e.marketTotalCollateralBalance * price;
      e.isReduceOnly = isReduceOnly;
      e.isLiquidationAllowed = isLiquidationAllowed;
      e.immutabilityDeadline = getBnToNumber(immutabilityDeadline[i], 0);
      e.totalPaidDebt = getBnToNumber(totalPaidDebt[i], 18);
      e.totalFreeDebt = getBnToNumber(totalFreeDebt[i], 18);
      e.totalFreeDebtShares = getBnToNumber(totalFreeDebtShares[i], 18);
      e.totalPaidDebtShares = getBnToNumber(totalPaidDebtShares[i], 18);
      e.cachedGlobalFeePerc = getBnToNumber(cachedGlobalFeeBps[i], 2);
      e.accruedLocalReserves = getBnToNumber(accruedLocalReserves[i], 18);
      e.accruedGlobalReserves = getBnToNumber(accruedGlobalReserves[i], 18);
      e.operator = operator[i];
      e.feePerc = getBnToNumber(feeBps[i], 2);
      e.lastAccrue = getBnToNumber(lastAccrue[i], 0);
      e.lastBorrowRateMantissa = getBnToNumber(lastBorrowRateMantissa[i], 18);
      e.redeemFeePerc = getBnToNumber(redeemFeeBps[i], 2);
      e.targetFreeDebtRatioStartPerc = getBnToNumber(targetFreeDebtRatioStartBps[i], 2);
      e.targetFreeDebtRatioEndPerc = getBnToNumber(targetFreeDebtRatioEndBps[i], 2);
      e.expRate = getBnToNumber(expRate[i], 18);
      e.freeDebtRatio = e.totalFreeDebt === 0 ? 0 : e.totalFreeDebt / (e.totalPaidDebt + e.totalFreeDebt);
      e.staked = getBnToNumber(staked[i], 18);
      e.totalDebt = e.totalPaidDebt + e.totalFreeDebt;
    });

    const [realTimeBorrowRate] = await getGroupedMulticallOutputs(
      [
        deployments.map((e, i) => {
          const timeElapsed = Math.floor((now / 1000 - e.lastAccrue));
          return { contract: new Contract(e.interestModel, INTEREST_MODEL_ABI, provider), functionName: 'calculateInterest', params: [totalPaidDebt[i], lastBorrowRateMantissa[i], timeElapsed, expRate[i], getNumberToBn(e.freeDebtRatio, 4), targetFreeDebtRatioStartBps[i], targetFreeDebtRatioEndBps[i]] }
        }),
      ],
      Number(chainId),
      currentBlock,
      provider,
    );

    deployments.forEach((e, i) => {
      const realTimeBorrowApr = getBnToNumber(realTimeBorrowRate[i][0], 18);
      // staking APY calc
      const totalAssets = e.staked;

      const stakedBalance = Math.max(1, totalAssets);
      const annualInterest = e.totalPaidDebt * realTimeBorrowApr;
      const annualInterestAfterFee = annualInterest * (1 - ((e.feePerc/100) || 0) - ((e.cachedGlobalFeePerc/100) || 0));
      const finalAnnualInterestsForStakers = stakedBalance < e.totalPaidDebt && e.totalPaidDebt > 0 ? annualInterestAfterFee * stakedBalance / e.totalPaidDebt : annualInterestAfterFee;

      const apr = stakedBalance ? finalAnnualInterestsForStakers / stakedBalance * 100 : 0;
      const apy = aprToApy(apr, BLOCKS_PER_YEAR);
      e.borrowApr = realTimeBorrowApr * 100;
      e.borrowApy = aprToApy(e.borrowApr, BLOCKS_PER_YEAR);
      e.stakingApr = apr;
      e.stakingApy = apy;
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