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

export const LENDER_ABI = [{"type":"constructor","inputs":[{"name":"params","type":"tuple","internalType":"struct Lender.LenderParams","components":[{"name":"collateral","type":"address","internalType":"contract ERC20"},{"name":"psmAsset","type":"address","internalType":"contract ERC20"},{"name":"psmVault","type":"address","internalType":"contract ERC4626"},{"name":"feed","type":"address","internalType":"contract IChainlinkFeed"},{"name":"coin","type":"address","internalType":"contract Coin"},{"name":"vault","type":"address","internalType":"contract Vault"},{"name":"interestModel","type":"address","internalType":"contract InterestModel"},{"name":"factory","type":"address","internalType":"contract IFactory"},{"name":"operator","type":"address","internalType":"address"},{"name":"manager","type":"address","internalType":"address"},{"name":"collateralFactor","type":"uint256","internalType":"uint256"},{"name":"minDebt","type":"uint256","internalType":"uint256"},{"name":"timeUntilImmutability","type":"uint256","internalType":"uint256"},{"name":"halfLife","type":"uint64","internalType":"uint64"},{"name":"targetFreeDebtRatioStartBps","type":"uint16","internalType":"uint16"},{"name":"targetFreeDebtRatioEndBps","type":"uint16","internalType":"uint16"},{"name":"redeemFeeBps","type":"uint16","internalType":"uint16"}]}],"stateMutability":"nonpayable"},{"type":"function","name":"MIN_LIQUIDATION_DEBT","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"STALENESS_THRESHOLD","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"STALENESS_UNWIND_DURATION","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"_cachedCollateralBalances","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"acceptOperator","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"accrueInterest","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"accruedGlobalReserves","inputs":[],"outputs":[{"name":"","type":"uint120","internalType":"uint120"}],"stateMutability":"view"},{"type":"function","name":"accruedLocalReserves","inputs":[],"outputs":[{"name":"","type":"uint120","internalType":"uint120"}],"stateMutability":"view"},{"type":"function","name":"adjust","inputs":[{"name":"account","type":"address","internalType":"address"},{"name":"collateralDelta","type":"int256","internalType":"int256"},{"name":"debtDelta","type":"int256","internalType":"int256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"adjust","inputs":[{"name":"account","type":"address","internalType":"address"},{"name":"collateralDelta","type":"int256","internalType":"int256"},{"name":"debtDelta","type":"int256","internalType":"int256"},{"name":"chooseRedeemable","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"borrowerEpoch","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"borrowerLastRedeemedIndex","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"buy","inputs":[{"name":"assetIn","type":"uint256","internalType":"uint256"},{"name":"minCoinOut","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"coinOut","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"cachedGlobalFeeBps","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"coin","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract Coin"}],"stateMutability":"view"},{"type":"function","name":"collateral","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ERC20"}],"stateMutability":"view"},{"type":"function","name":"collateralFactor","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"delegate","inputs":[{"name":"delegatee","type":"address","internalType":"address"},{"name":"isDelegatee","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"delegations","inputs":[{"name":"","type":"address","internalType":"address"},{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"deployTimestamp","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"enableImmutabilityNow","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"epoch","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"epochRedeemedCollateral","inputs":[{"name":"","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"expRate","inputs":[],"outputs":[{"name":"","type":"uint64","internalType":"uint64"}],"stateMutability":"view"},{"type":"function","name":"factory","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IFactory"}],"stateMutability":"view"},{"type":"function","name":"feeBps","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"feed","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract IChainlinkFeed"}],"stateMutability":"view"},{"type":"function","name":"freeDebtShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"freePsmAssets","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getBuyAmountOut","inputs":[{"name":"assetIn","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"coinOut","type":"uint256","internalType":"uint256"},{"name":"coinFee","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getBuyFeeBps","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getCollateralPrice","inputs":[],"outputs":[{"name":"price","type":"uint256","internalType":"uint256"},{"name":"reduceOnly","type":"bool","internalType":"bool"},{"name":"allowLiquidations","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"getDebtOf","inputs":[{"name":"account","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getFeedPrice","inputs":[],"outputs":[{"name":"price","type":"uint256","internalType":"uint256"},{"name":"updatedAt","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getFreeDebtRatio","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getRedeemAmountOut","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getSellAmountOut","inputs":[{"name":"coinIn","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"assetOut","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"immutabilityDeadline","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"interestModel","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract InterestModel"}],"stateMutability":"view"},{"type":"function","name":"isRedeemable","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"lastAccrue","inputs":[],"outputs":[{"name":"","type":"uint40","internalType":"uint40"}],"stateMutability":"view"},{"type":"function","name":"lastBorrowRateMantissa","inputs":[],"outputs":[{"name":"","type":"uint88","internalType":"uint88"}],"stateMutability":"view"},{"type":"function","name":"liquidate","inputs":[{"name":"borrower","type":"address","internalType":"address"},{"name":"repayAmount","type":"uint256","internalType":"uint256"},{"name":"minCollateralOut","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"manager","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"minDebt","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"nonRedeemableCollateral","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"operator","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"paidDebtShares","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"pendingOperator","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"psmAsset","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ERC20"}],"stateMutability":"view"},{"type":"function","name":"psmVault","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract ERC4626"}],"stateMutability":"view"},{"type":"function","name":"pullGlobalReserves","inputs":[{"name":"_to","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"pullLocalReserves","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"reapprovePsmVault","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"redeem","inputs":[{"name":"amountIn","type":"uint256","internalType":"uint256"},{"name":"minAmountOut","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"amountOut","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"redeemFeeBps","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"sell","inputs":[{"name":"coinIn","type":"uint256","internalType":"uint256"},{"name":"minAssetOut","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"assetOut","type":"uint256","internalType":"uint256"}],"stateMutability":"nonpayable"},{"type":"function","name":"setHalfLife","inputs":[{"name":"halfLife","type":"uint64","internalType":"uint64"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setLocalReserveFeeBps","inputs":[{"name":"_feeBps","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setManager","inputs":[{"name":"_manager","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setPendingOperator","inputs":[{"name":"_pendingOperator","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setRedeemFeeBps","inputs":[{"name":"_redeemFeeBps","type":"uint16","internalType":"uint16"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setRedemptionStatus","inputs":[{"name":"account","type":"address","internalType":"address"},{"name":"chooseRedeemable","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setTargetFreeDebtRatio","inputs":[{"name":"startBps","type":"uint16","internalType":"uint16"},{"name":"endBps","type":"uint16","internalType":"uint16"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"targetFreeDebtRatioEndBps","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"targetFreeDebtRatioStartBps","inputs":[],"outputs":[{"name":"","type":"uint16","internalType":"uint16"}],"stateMutability":"view"},{"type":"function","name":"totalFreeDebt","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalFreeDebtShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalPaidDebt","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"totalPaidDebtShares","inputs":[],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"vault","inputs":[],"outputs":[{"name":"","type":"address","internalType":"contract Vault"}],"stateMutability":"view"},{"type":"function","name":"writeOff","inputs":[{"name":"borrower","type":"address","internalType":"address"},{"name":"to","type":"address","internalType":"address"}],"outputs":[{"name":"writtenOff","type":"bool","internalType":"bool"}],"stateMutability":"nonpayable"},{"type":"event","name":"Bought","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"assetIn","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"coinOut","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"DelegationUpdated","inputs":[{"name":"delegator","type":"address","indexed":true,"internalType":"address"},{"name":"delegatee","type":"address","indexed":true,"internalType":"address"},{"name":"isDelegatee","type":"bool","indexed":false,"internalType":"bool"}],"anonymous":false},{"type":"event","name":"HalfLifeUpdated","inputs":[{"name":"halfLife","type":"uint64","indexed":false,"internalType":"uint64"}],"anonymous":false},{"type":"event","name":"Liquidated","inputs":[{"name":"borrower","type":"address","indexed":true,"internalType":"address"},{"name":"liquidator","type":"address","indexed":true,"internalType":"address"},{"name":"repayAmount","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"collateralOut","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"LocalReserveFeeUpdated","inputs":[{"name":"feeBps","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"ManagerUpdated","inputs":[{"name":"manager","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"NewEpoch","inputs":[{"name":"epoch","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"OperatorAccepted","inputs":[{"name":"operator","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"PendingOperatorUpdated","inputs":[{"name":"pendingOperator","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"PositionAdjusted","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"collateralDelta","type":"int256","indexed":false,"internalType":"int256"},{"name":"debtDelta","type":"int256","indexed":false,"internalType":"int256"}],"anonymous":false},{"type":"event","name":"RedeemFeeBpsUpdated","inputs":[{"name":"redeemFeeBps","type":"uint16","indexed":false,"internalType":"uint16"}],"anonymous":false},{"type":"event","name":"Redeemed","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"amountIn","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"amountOut","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"RedemptionStatusUpdated","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"isRedeemable","type":"bool","indexed":false,"internalType":"bool"}],"anonymous":false},{"type":"event","name":"Sold","inputs":[{"name":"account","type":"address","indexed":true,"internalType":"address"},{"name":"coinIn","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"assetOut","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false},{"type":"event","name":"TargetFreeDebtRatioUpdated","inputs":[{"name":"startBps","type":"uint16","indexed":false,"internalType":"uint16"},{"name":"endBps","type":"uint16","indexed":false,"internalType":"uint16"}],"anonymous":false},{"type":"event","name":"WrittenOff","inputs":[{"name":"borrower","type":"address","indexed":true,"internalType":"address"},{"name":"to","type":"address","indexed":true,"internalType":"address"},{"name":"debt","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"collateral","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false}]
const LENS_ABI = [{"type":"function","name":"getCollateralOf","inputs":[{"name":"_lender","type":"address","internalType":"contract Lender"},{"name":"_borrower","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"}];

const LENSES = {
  1: "0x9FB6d67bC0D112C428d7405A10f0a0029B478238",
  11155111: "0x3De0b01AA2a59F960E48dc00dFdC39EaD51d0d62",
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
  
  const { account, chainId, lender, cacheFirst } = req.query;
  if(!monolithSupportedChainIds.includes(chainId) || !lender || lender === BURN_ADDRESS || (!!lender && !isAddress(lender)) || (!!account && !isAddress(account))) {
    return res.status(400).json({ success: false, error: 'Invalid account address' });
  }
  const cacheKey = account ? `monolith-positions-${lender}-${account}-${chainId}-v1.0.2` : `monolith-positions-${lender}-${chainId}-v1.0.2`;  
  try {

    const { isValid, data: cachedData } = await getCacheFromRedisAsObj(cacheKey, cacheFirst !== 'true', cacheDuration, false);
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

    const sumDeposits = deposits.reduce((acc, curr) => acc + curr, 0);

    const resultData = {
      timestamp: now,
      collateralFactor,
      price,
      tvl: sumDeposits * price,
      isReduceOnly,
      isLiquidationAllowed,
      nbUniqueUsers: totalUniqueUsers.length,
      activeUsers: activeUsers,
      nbActiveUsers: activeUsers.length,
      nbRedeemableUsers: redeemablePositions.length,
      nbNonRedeemableUsers: nonRedeemablePositions.length,
      sumDebts: sumDebts,
      sumDeposits,
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