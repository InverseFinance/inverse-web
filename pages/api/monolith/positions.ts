import { Contract } from 'ethers'
import 'source-map-support'
import { getPaidProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, isInvalidGenericParam, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { isAddress } from 'ethers/lib/utils';
import { estimateBlockTimestamp } from '@app/util/misc';
import { getLargeLogs } from '@app/util/web3';
import { getGroupedMulticallOutputs } from '@app/util/multicall';
import { BURN_ADDRESS } from '@app/config/constants';

const LENDER_ABI = [{"inputs":[{"internalType":"contract ERC20","name":"_collateral","type":"address"},{"internalType":"contract IChainlinkFeed","name":"_feed","type":"address"},{"internalType":"contract Coin","name":"_coin","type":"address"},{"internalType":"contract Vault","name":"_vault","type":"address"},{"internalType":"contract InterestModel","name":"_interestModel","type":"address"},{"internalType":"contract IFactory","name":"_factory","type":"address"},{"internalType":"address","name":"_operator","type":"address"},{"internalType":"uint256","name":"_collateralFactor","type":"uint256"},{"internalType":"uint256","name":"_minDebt","type":"uint256"},{"internalType":"uint256","name":"_timeUntilImmutability","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"delegator","type":"address"},{"indexed":true,"internalType":"address","name":"delegatee","type":"address"},{"indexed":false,"internalType":"bool","name":"isDelegatee","type":"bool"}],"name":"DelegationUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint64","name":"halfLife","type":"uint64"}],"name":"HalfLifeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"borrower","type":"address"},{"indexed":true,"internalType":"address","name":"liquidator","type":"address"},{"indexed":false,"internalType":"uint256","name":"repayAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"collateralOut","type":"uint256"}],"name":"Liquidated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"feeBps","type":"uint256"}],"name":"LocalReserveFeeUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"NewEpoch","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"operator","type":"address"}],"name":"OperatorAccepted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"pendingOperator","type":"address"}],"name":"PendingOperatorUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"int256","name":"collateralDelta","type":"int256"},{"indexed":false,"internalType":"int256","name":"debtDelta","type":"int256"}],"name":"PositionAdjusted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"redeemFeeBps","type":"uint16"}],"name":"RedeemFeeBpsUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountIn","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amountOut","type":"uint256"}],"name":"Redeemed","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":false,"internalType":"bool","name":"isRedeemable","type":"bool"}],"name":"RedemptionStatusUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint16","name":"startBps","type":"uint16"},{"indexed":false,"internalType":"uint16","name":"endBps","type":"uint16"}],"name":"TargetFreeDebtRatioUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"borrower","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"debt","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"collateral","type":"uint256"}],"name":"WrittenOff","type":"event"},{"inputs":[],"name":"MIN_LIQUIDATION_DEBT","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"STALENESS_THRESHOLD","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"STALENESS_UNWIND_DURATION","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"_cachedCollateralBalances","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"acceptOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"accrueInterest","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"accruedGlobalReserves","outputs":[{"internalType":"uint120","name":"","type":"uint120"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"accruedLocalReserves","outputs":[{"internalType":"uint120","name":"","type":"uint120"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"int256","name":"collateralDelta","type":"int256"},{"internalType":"int256","name":"debtDelta","type":"int256"}],"name":"adjust","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"int256","name":"collateralDelta","type":"int256"},{"internalType":"int256","name":"debtDelta","type":"int256"},{"internalType":"bool","name":"chooseRedeemable","type":"bool"}],"name":"adjust","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"borrowerEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"borrowerLastRedeemedIndex","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"cachedGlobalFeeBps","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"coin","outputs":[{"internalType":"contract Coin","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"collateral","outputs":[{"internalType":"contract ERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"collateralFactor","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"delegatee","type":"address"},{"internalType":"bool","name":"isDelegatee","type":"bool"}],"name":"delegate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"delegations","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"enableImmutabilityNow","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"epoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"epochRedeemedCollateral","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"expRate","outputs":[{"internalType":"uint64","name":"","type":"uint64"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"contract IFactory","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeBps","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feed","outputs":[{"internalType":"contract IChainlinkFeed","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"freeDebtShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getCollateralPrice","outputs":[{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"bool","name":"reduceOnly","type":"bool"},{"internalType":"bool","name":"allowLiquidations","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"getDebtOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFeedPrice","outputs":[{"internalType":"uint256","name":"price","type":"uint256"},{"internalType":"uint256","name":"updatedAt","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getFreeDebtRatio","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"name":"getRedeemAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"immutabilityDeadline","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"interestModel","outputs":[{"internalType":"contract InterestModel","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"isRedeemable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastAccrue","outputs":[{"internalType":"uint40","name":"","type":"uint40"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"lastBorrowRateMantissa","outputs":[{"internalType":"uint88","name":"","type":"uint88"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"borrower","type":"address"},{"internalType":"uint256","name":"repayAmount","type":"uint256"},{"internalType":"uint256","name":"minCollateralOut","type":"uint256"}],"name":"liquidate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"minDebt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"operator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"paidDebtShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pendingOperator","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"}],"name":"pullGlobalReserves","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"pullLocalReserves","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"minAmountOut","type":"uint256"}],"name":"redeem","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"redeemFeeBps","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint64","name":"halfLife","type":"uint64"}],"name":"setHalfLife","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_feeBps","type":"uint256"}],"name":"setLocalReserveFeeBps","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_pendingOperator","type":"address"}],"name":"setPendingOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"_redeemFeeBps","type":"uint16"}],"name":"setRedeemFeeBps","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"bool","name":"chooseRedeemable","type":"bool"}],"name":"setRedemptionStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint16","name":"startBps","type":"uint16"},{"internalType":"uint16","name":"endBps","type":"uint16"}],"name":"setTargetFreeDebtRatio","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"targetFreeDebtRatioEndBps","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"targetFreeDebtRatioStartBps","outputs":[{"internalType":"uint16","name":"","type":"uint16"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalFreeDebt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalFreeDebtShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalPaidDebt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalPaidDebtShares","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"vault","outputs":[{"internalType":"contract Vault","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"borrower","type":"address"},{"internalType":"address","name":"to","type":"address"}],"name":"writeOff","outputs":[{"internalType":"bool","name":"writtenOff","type":"bool"}],"stateMutability":"nonpayable","type":"function"}];
const LENS_ABI = [{"type":"function","name":"getCollateralOf","inputs":[{"name":"_lender","type":"address","internalType":"contract Lender"},{"name":"_borrower","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"}];

const LENSES = {
  1: "0x941A224090dC7890BCbC89aDfD045D45E95E7Fb7",
  11155111: "0x542f65d73263F129D6313D7e6060885465b6e91b",
}

export const monolithSupportedChainIds = Object.keys(LENSES);

// function getLiquidatableDebt(uint collateralBalance, uint price, uint debt) internal view returns(uint liquidatableDebt){
//   uint borrowingPower = price * collateralBalance * collateralFactor / 1e18 / 10000;
//   if(borrowingPower > debt) return 0;
//   // liquidate 25% of the total debt
//   liquidatableDebt = debt / 4; // 25% of the debt
//   // liquidate at least MIN_LIQUIDATION_DEBT (or the entire debt if it's less than MIN_LIQUIDATION_DEBT)
//   if(liquidatableDebt < MIN_LIQUIDATION_DEBT) liquidatableDebt = debt < MIN_LIQUIDATION_DEBT ? debt : MIN_LIQUIDATION_DEBT;
// }

const getLiquidatableDebt = (collateralBalance: number, price: number, debt: number, collateralFactor: number) => {
  const borrowingPower = price * collateralBalance * collateralFactor;
  if(borrowingPower > debt) return 0;
  let liquidatableDebt = debt / 4;
  if(liquidatableDebt < 10_000) liquidatableDebt = (debt < 10_000 ? debt : 10_000);
  return liquidatableDebt;
}

export default async function handler(req, res) {
  const cacheDuration = 60;
  res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
  res.setHeader('Access-Control-Allow-Headers', `Content-Type`);
  res.setHeader('Access-Control-Allow-Origin', `*`);
  res.setHeader('Access-Control-Allow-Methods', `OPTIONS,POST,GET`);
  
  const { account, chainId, lender } = req.query;
  if(!monolithSupportedChainIds.includes(chainId) || !lender || lender === BURN_ADDRESS || (!!lender && !isAddress(lender)) || (!!account && !isAddress(account))) {
    return res.status(400).json({ success: false, error: 'Invalid account address' });
  }
  const cacheKey = account ? `monolith-positions-${lender}-${account}-${chainId}-v1.0.2` : `monolith-positions-${lender}-${chainId}-v1.0.2`;  
  try {

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, true, cacheDuration, false);
    if (isValid) {
      res.status(200).json(cachedData);
      return
    }

    const provider = getPaidProvider(Number(chainId || 1));

    const lenderContract = new Contract(lender, LENDER_ABI, provider);
    const hasLens = !!LENSES[chainId];
    const lensContract = hasLens ? new Contract(LENSES[chainId], LENS_ABI, provider) : undefined;
    const lastBlock = cachedData?.last100Events?.length ? cachedData?.last100Events[cachedData.last100Events.length-1].blockNumber : undefined;
    
    let events: any[] = [];

    const [currentBlock, collateralAddress, totalFreeDebtBn, totalPaidDebtBn, liquidationMetaData, collateralFactorBn] = await Promise.all([
      provider.getBlockNumber(),
      lenderContract.collateral(),
      lenderContract.totalFreeDebt(),
      lenderContract.totalPaidDebt(),
      lenderContract.getCollateralPrice(),
      lenderContract.collateralFactor(),
    ]);

    const now = Date.now();
    const collateralContract = new Contract(collateralAddress, ["function decimals() view returns (uint8)"], provider);
    const decimals = await collateralContract.decimals();
    const [priceBn, isReduceOnly, isLiquidationAllowed] = liquidationMetaData;
    // always use 18 decimals for price
    const price = getBnToNumber(priceBn, 18);
    const collateralFactor = getBnToNumber(collateralFactorBn, 4);
    const totalFreeDebt = getBnToNumber(totalFreeDebtBn, 18);
    const totalPaidDebt = getBnToNumber(totalPaidDebtBn, 18);
    const totalDebt = totalFreeDebt + totalPaidDebt;

    const getLargeLogsFunction = () => {
      return getLargeLogs(
        lenderContract,
        lenderContract.filters.PositionAdjusted(account || undefined),
        lastBlock ? lastBlock+1 : currentBlock - 50_000,
        currentBlock,
        10_000,
      );
    }

    try {
      if(!account) {
        events = await getLargeLogsFunction();
      } else {
        events = await lenderContract.queryFilter(lenderContract.filters.PositionAdjusted(account || undefined), lastBlock ? lastBlock+1 : undefined, currentBlock);
      }
    } catch (e) {
      console.log('e', e);
      if(!!account){
        console.log('fetching with large log function');
        events = await getLargeLogsFunction();
      }
    }

    const cachedEvents = cachedData?.last100Events || [];

    const newEvents = events.map(e => {
      return {
        txHash: e.transactionHash,
        blockNumber: e.blockNumber,
        timestamp: estimateBlockTimestamp(e.blockNumber, now, currentBlock),
        account: e.args?.account,
        collateralDelta: getBnToNumber(e.args?.collateralDelta, decimals),
        debtDelta: getBnToNumber(e.args?.debtDelta, 18),
      }
    });

    const cachedUsers = cachedData?.uniqueUsers || [];
    const newUsers = newEvents.map(e => e.account);
    const totalUniqueUsers = [...new Set(cachedUsers.concat(newUsers))];

    const [debtsBn, depositsBn, isRedeemable] = await getGroupedMulticallOutputs(
      [
        totalUniqueUsers.map(u => {
          return { contract: lenderContract, functionName: 'getDebtOf', params: [u] }
        }),
        totalUniqueUsers.map(u => {
          return lensContract ? { contract: lensContract, functionName: 'getCollateralOf', params: [lender, u] } : { contract: lenderContract, functionName: '_cachedCollateralBalances', params: [u] }
        }),
        totalUniqueUsers.map(u => {
          return { contract: lenderContract, functionName: 'isRedeemable', params: [u] }
        }),
      ],
      Number(chainId),
      currentBlock,
      provider,
    );

    const deposits = depositsBn.map((bn, i) => getBnToNumber(bn, decimals));
    const debts = debtsBn.map((bn, i) => getBnToNumber(bn, 18));

    const positions = totalUniqueUsers.map((u, i) => {
      const liquidatableDebt = getLiquidatableDebt(deposits[i], price, debts[i], collateralFactor);
      const borrowingPower = deposits[i] * collateralFactor * price;
      return {
        account: u,
        deposits: deposits[i],
        debt: debts[i],
        isRedeemable: isRedeemable[i],
        depositsUsd: deposits[i] * price,
        borrowingPower,
        liquidatableDebt,
        shortfall: borrowingPower > debts[i] ? 0 : debts[i] - borrowingPower,
        hasShortfall: liquidatableDebt > 0,
      }
    });

    const activePositions = positions.filter(p => p.deposits > 0 || p.debt > 0);
    const activeUsers = activePositions.map(p => p.account);
    const redeemablePositions = activePositions.filter(p => p.isRedeemable);
    const nonRedeemablePositions = activePositions.filter(p => !p.isRedeemable);
    
    const sumPaidDebt = nonRedeemablePositions.reduce((acc, curr) => acc + curr.debt, 0)
    const sumFreeDebt = redeemablePositions.reduce((acc, curr) => acc + curr.debt, 0)
    const sumDebts = debts.reduce((acc, curr) => acc + curr, 0)
    const hasDiscrepancy = ((sumFreeDebt + sumPaidDebt) !== sumDebts) || sumFreeDebt !== totalFreeDebt || sumPaidDebt !== totalPaidDebt || totalDebt !== sumDebts;

    const resultData = {
      timestamp: now,
      collateralFactor,
      price,
      isReduceOnly,
      isLiquidationAllowed,
      nbUniqueUsers: totalUniqueUsers.length,
      activeUsers: activeUsers,
      nbActiveUsers: activeUsers.length,
      nbRedeemableUsers: redeemablePositions.length,
      nbNonRedeemableUsers: nonRedeemablePositions.length,
      sumDebts: sumDebts,
      sumDeposits: deposits.reduce((acc, curr) => acc + curr, 0),
      sumFreeDebt: sumFreeDebt,
      sumPaidDebt: sumPaidDebt,
      lenderTotalFreeDebt: totalFreeDebt,
      lenderTotalPaidDebt: totalPaidDebt,
      lenderTotalDebt: totalDebt,
      hasDiscrepancy: hasDiscrepancy,
      uniqueUsers: totalUniqueUsers,
      last100Events: cachedEvents.concat(newEvents).slice(-100),
      positions: activePositions,
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