
import { F2Market, FirmAction, SWR } from "@app/types"
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from "./useCustomSWR";
import { useDBRMarkets } from "./useDBR";
import { f2CalcNewHealth } from "@app/util/f2";
import { getBnToNumber, getNumberToBn } from "@app/util/markets";
import { useMultiContractEvents } from "./useContractEvents";
import { DBR_ABI, F2_MARKET_ABI } from "@app/config/abis";
import { getNetworkConfigConstants } from "@app/util/networks";
import { uniqueBy } from "@app/util/misc";
import { ONE_DAY_MS } from "@app/config/constants";

const oneYear = ONE_DAY_MS * 365;

const { DBR, F2_MARKETS } = getNetworkConfigConstants();

export const useFirmPositions = (isShortfallOnly = false): SWR & {
  positions: any,
  timestamp: number,
} => {
  const { data, error } = useCustomSWR(`/api/f2/firm-positions?shortfallOnly=${isShortfallOnly}`, fetcher);
  const { markets } = useDBRMarkets();

  const positions = data ? data.positions : [];

  const positionsWithMarket = positions?.map(p => {
    const market = markets[p.marketIndex];
    const { newPerc, newCreditLimit, newLiquidationPrice, newCreditLeft } = f2CalcNewHealth(market, p.deposits, p.debt);
    const seizableWorth = p.liquidatableDebt + market.liquidationIncentive * p.liquidatableDebt;
    return {
      ...p,
      seizable: seizableWorth / market.price,
      seizableWorth,
      liquidatableDebtBn: getNumberToBn(p.liquidatableDebt),
      isLiquidatable: p.liquidatableDebt > 0,
      marketName: market.name,
      market,
      perc: newPerc,
      creditLimit: newCreditLimit,
      liquidationPrice: newLiquidationPrice,
      creditLeft: newCreditLeft,
      userBorrowLimit: 100-newPerc,
      tvl: p.deposits * market.price,
      key: `${p.user}-${p.marketIndex}`,
    }
  });

  return {
    positions: positionsWithMarket,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRActiveHolders = (): SWR & {
  positions: any,
  timestamp: number,
} => {
  const { data, error } = useCustomSWR(`/api/f2/dbr-deficits?v2`, fetcher);
  const { positions: firmPositions } = useFirmPositions();

  const activeDbrHolders = data ? data.activeDbrHolders : [];

  const activeDbrHoldersWithMarkets = activeDbrHolders.map(s => {
    const marketPositions = firmPositions?.filter(p => p.user === s.user) || [];
    const marketIcons = marketPositions?.map(p => p.market.underlying.image) || [];
    const dailyBurn = s.debt/oneYear * ONE_DAY_MS;
    const dbrNbDaysExpiry = dailyBurn ? s.signedBalance / dailyBurn : 0;
    const dbrExpiryDate = !s.debt ? null : (+new Date() + dbrNbDaysExpiry * ONE_DAY_MS);
    return {
      ...s,
      marketPositions,
      marketIcons,
      dailyBurn,
      dbrExpiryDate,
    }
  }).filter(p => p.debt > 0);

  return {
    positions: activeDbrHoldersWithMarkets,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

const COMBINATIONS = {
  'Deposit': 'Borrow',
  'Borrow': 'Deposit',
  'Repay': 'Withdraw',
  'Withdraw': 'Repay',
}
const COMBINATIONS_NAMES = {
  'Deposit': 'DepositBorrow',
  'Borrow': 'DepositBorrow',
  'Repay': 'RepayWithdraw',
  'Withdraw': 'RepayWithdraw',
}

export const useFirmMarketEvents = (market: F2Market, account: string): {
  events: FirmAction[]
  isLoading: boolean
  error: any
} => {
  const { groupedEvents, isLoading, error } = useMultiContractEvents([
    [market.address, F2_MARKET_ABI, 'Deposit', [account]],
    [market.address, F2_MARKET_ABI, 'Withdraw', [account]],
    [market.address, F2_MARKET_ABI, 'Borrow', [account]],
    [market.address, F2_MARKET_ABI, 'Repay', [account]],
    [market.address, F2_MARKET_ABI, 'Liquidate', [account]],
    // [market.address, F2_MARKET_ABI, 'CreateEscrow', [account]],
    [DBR, DBR_ABI, 'ForceReplenish', [account]],
  ], `firm-market-${market.address}-${account}`);

  const flatenedEvents = groupedEvents.flat();

  const events = flatenedEvents.map(e => {
    const isCollateralEvent = ['Deposit', 'Withdraw'].includes(e.event);
    const decimals = isCollateralEvent ? market.underlying.decimals : 18;

    // Deposit can be associated with Borrow, withdraw with repay
    let combinedEvent;    
    const combinedEventName = COMBINATIONS[e.event];
    if (combinedEventName) {
      combinedEvent = flatenedEvents.find(e2 => e.transactionHash === e2.transactionHash && e2.event === combinedEventName);
    }

    const tokenName = isCollateralEvent ? market.underlying.symbol : e.args?.replenisher ? 'DBR' : 'DOLA';
    const actionName = !!combinedEvent ? COMBINATIONS_NAMES[e.event] : e.event;

    return {
      combinedKey: `${e.transactionHash}-${actionName}-${e.args?.account}`,
      actionName,
      blockNumber: e.blockNumber,
      txHash: e.transactionHash,
      amount: e.args?.amount ? getBnToNumber(e.args?.amount, decimals) : undefined,
      isCombined: !!combinedEvent,
      amountCombined: combinedEvent?.args?.amount ? getBnToNumber(combinedEvent.args.amount, decimals) : undefined,
      deficit: e.args?.deficit ? getBnToNumber(e.args?.deficit, 18) : undefined,
      repaidDebt: e.args?.repaidDebt ? getBnToNumber(e.args?.repaidDebt, 18) : undefined,
      liquidatorReward: e.args?.liquidatorReward ? getBnToNumber(e.args?.liquidatorReward, 18) : undefined,
      repayer: e.args?.repayer,
      to: e.args?.to,
      escrow: e.args?.escrow,
      replenisher: e.args?.replenisher,
      name: e.event,
      nameCombined: combinedEventName,
      logIndex: e.logIndex,
      isCollateralEvent,
      tokenName,
      tokenNameCombined: tokenName === 'DOLA' ? market.underlying.symbol : 'DOLA',
    }
  });
  
  const grouped = uniqueBy(events, (o1, o2) => o1.combinedKey === o2.combinedKey);
  grouped.sort((a, b) => a.blockNumber !== b.blockNumber ? (b.blockNumber - a.blockNumber) : b.logIndex - a.logIndex);

  return {
    events: grouped,
    isLoading,
    error,
  }
}

export const useDBRReplenishments = (): SWR & {
  events: any,
  timestamp: number,
} => {
  const { data, error } = useCustomSWR(`/api/f2/dbr-replenishments`, fetcher);

  const eventsWithMarket = (data?.events || []).map(e => {
    const market = F2_MARKETS.find(m => m.address === e.marketAddress);
    return {
      ...e,
      key: `${e.txHash}-${e.account}-${e.marketAddress}`,
      market,
      marketName: market?.name,
    }
  });

  return {
    events: eventsWithMarket,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}