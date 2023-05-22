
import { F2Market, FirmAction, SWR, ZapperToken } from "@app/types"
import { fetcher, fetcher30sectimeout } from '@app/util/web3'
import { useCacheFirstSWR, useCustomSWR } from "./useCustomSWR";
import { useDBRMarkets, useDBRPrice } from "./useDBR";
import { f2CalcNewHealth } from "@app/util/f2";
import { getBnToNumber, getNumberToBn } from "@app/util/markets";
import { useMultiContractEvents } from "./useContractEvents";
import { DBR_ABI, F2_ESCROW_ABI, F2_MARKET_ABI } from "@app/config/abis";
import { getNetworkConfigConstants } from "@app/util/networks";
import { uniqueBy } from "@app/util/misc";
import { ONE_DAY_MS, ONE_DAY_SECS } from "@app/config/constants";
import useEtherSWR from "./useEtherSWR";
import { useAccount } from "./misc";

const oneYear = ONE_DAY_MS * 365;

const { DBR, DBR_DISTRIBUTOR } = getNetworkConfigConstants();

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
      userBorrowLimit: 100 - newPerc,
      tvl: p.deposits * market.price,
      debtRiskWeight: newPerc * p.debt,
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
    const dailyBurn = s.debt / oneYear * ONE_DAY_MS;
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
  const { markets } = useDBRMarkets();

  const eventsWithMarket = (data?.events || []).map(e => {
    const market = markets?.find(m => m.address === e.marketAddress);
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

export const useDBRBurns = (): SWR & {
  events: any,
  timestamp: number,
} => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/dbr-burns`, fetcher);

  return {
    events: data ? data.totalBurns : [],
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRDebtHisto = (): SWR & {
  timestamp: number,
  history: { debt: number, timestamp: number }[],
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/debt-histo?v1`, fetcher);

  const debts = data?.debts || [];
  const history = debts.map((d, i) => {
    return {
      debt: d.reduce((a, b) => a + b, 0),
      timestamp: data.timestamps[i] * 1000,
    }
  });

  return {
    history,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useINVEscrowRewards = (escrow: string): SWR & {
  rewards: number,
  rewardsInfos: { tokens: ZapperToken[] },
} => {
  const account = useAccount();
  const { data: dbrSimData } = useCustomSWR(`/api/f2/sim-dbr-rewards?escrow=${escrow}&account=${account}`, fetcher30sectimeout);
  const { data, error } = useEtherSWR({
    args: [[escrow, 'claimable']],
    abi: F2_ESCROW_ABI,
  });  
  const { data: rewardRateBn } = useEtherSWR([DBR_DISTRIBUTOR, 'rewardRate']);
  const { data: lastUpdate } = useEtherSWR([DBR_DISTRIBUTOR, 'lastUpdate']);
  const { data: totalSupplyBn } = useEtherSWR([DBR_DISTRIBUTOR, 'totalSupply']);

  const lastUpdateStored = lastUpdate ? getBnToNumber(lastUpdate, 0)*1000 : 0;
  const storedIsOutdated = !!data && !!dbrSimData && lastUpdateStored < dbrSimData?.timestamp;
  
  // per second
  const rewardRate = rewardRateBn ? getBnToNumber(rewardRateBn) : 0;
  const yearlyRewardRate = rewardRate * ONE_DAY_SECS * 365;
  const { price: dbrPrice } = useDBRPrice();

  const rewardsStored = data && data[0] ? getBnToNumber(data[0]) : 0;
  const rewards = storedIsOutdated ? dbrSimData?.simRewards : rewardsStored;
  const totalSupply = totalSupplyBn ? getBnToNumber(totalSupplyBn) : 0;

  const apr = !totalSupply ? 0 : yearlyRewardRate / totalSupply;

  const rewardsInfos = {
    timestamp: storedIsOutdated ? dbrSimData?.timestamp : lastUpdateStored,
    tokens: [
      {
        metaType: 'claimable',
        balanceUSD: rewards * dbrPrice,
        price: dbrPrice,
        balance: rewards,
        address: DBR,
      }
    ]
  };

  return {
    apr,
    yearlyRewardRate,
    totalSupply,
    rewards,
    rewardRate,
    rewardsInfos,
    isLoading: !error && !data,
    isError: error,
  }
};

export const useEscrowRewards = (escrow: string): SWR & {
  appGroupPositions: any[],
  timestamp: number,
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/escrow-rewards?escrow=${escrow || ''}`, fetcher);

  return {
    appGroupPositions: data?.appGroupPositions || [],
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useUserRewards = (user: string): SWR & {
  appGroupPositions: any[],
  timestamp: number,
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/user-rewards?user=${user || ''}`, fetcher);

  return {
    appGroupPositions: data?.appGroupPositions || [],
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}