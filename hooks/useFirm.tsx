
import { F2Market, FirmAction, SWR, ZapperToken } from "@app/types"
import { fetcher, fetcher30sectimeout, fetcher60sectimeout } from '@app/util/web3'
import { useCacheFirstSWR, useCustomSWR } from "./useCustomSWR";
import { useDBRMarkets, useDBRPrice } from "./useDBR";
import { f2CalcNewHealth, formatFirmEvents, getDBRRiskColor } from "@app/util/f2";
import { getBnToNumber, getHistoricalTokenData, getMonthlyRate, getNumberToBn } from "@app/util/markets";
import { useContractEvents, useMultiContractEvents } from "./useContractEvents";
import { DBR_ABI, ERC20_ABI, F2_ALE_ABI, F2_ESCROW_ABI, F2_MARKET_ABI } from "@app/config/abis";
import { getNetworkConfigConstants } from "@app/util/networks";
import { ascendingEventsSorter, uniqueBy } from "@app/util/misc";
import { BURN_ADDRESS, ONE_DAY_MS, ONE_DAY_SECS } from "@app/config/constants";
import useEtherSWR from "./useEtherSWR";
import { useAccount } from "./misc";
import { useBlocksTimestamps } from "./useBlockTimestamp";
import { TOKENS, getToken } from "@app/variables/tokens";
import { useDOLAPrice, usePrices } from "./usePrices";
import { getConvexLpRewards, getCvxCrvRewards, getCvxRewards } from "@app/util/firm-extra";
import { useWeb3React } from "@web3-react/core";
import useSWR from "swr";
import { FEATURE_FLAGS, isInvPrimeMember } from "@app/config/features";
import { useDolaStakingEarnings, useStakedDola } from "@app/util/dola-staking";
import { useStakedInv, useStakedInvBalance } from "@app/util/sINV";

const oneYear = ONE_DAY_MS * 365;

const { DBR, DBR_DISTRIBUTOR, F2_MARKETS, INV, F2_ALE, DOLA } = getNetworkConfigConstants();

export const useFirmPositions = (isShortfallOnly = false): SWR & {
  positions: any,
  timestamp: number,
  isLoading: boolean,
  isError: boolean,
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/firm-positions?shortfallOnly=${isShortfallOnly}`, fetcher60sectimeout);
  const { markets, isLoading } = useDBRMarkets();

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
      depositsUsd: p.deposits * market.price,
      creditLimit: newCreditLimit,
      liquidationPrice: newLiquidationPrice,
      creditLeft: newCreditLeft,
      userBorrowLimit: 100 - newPerc,
      tvl: p.deposits * market.price,
      debtRiskWeight: newPerc * p.debt,
      isStableMarket: !!market?.underlying?.isStable,
      key: `${p.user}-${p.marketIndex}`,
    }
  });

  return {
    positions: positionsWithMarket,
    timestamp: data ? data.timestamp : 0,
    isLoading: isLoading || (!error && !data),
    isError: error,
  }
}

export const useFirmUsers = (): SWR & {
  userPositions: any,
  positions: any,
  timestamp: number,
  isLoading: boolean,
} => {
  const { data, error, isLoading: isLoadingDbr } = useCacheFirstSWR(`/api/f2/dbr-deficits?v2`, fetcher60sectimeout);
  const { positions, timestamp, isLoading: isLoadingPositions, isError: isErrorPositions } = useFirmPositions();

  const activeDbrHolders = data ? data.activeDbrHolders : [];

  const uniqueUsers = [...new Set(positions.map(d => d.user))];
  const now = Date.now();
  const positionsAggregatedByUser = uniqueUsers.map(user => {
    const userPositions = positions.filter(p => p.user === user).sort((a, b) => b.debt - a.debt);
    const dueTokensAccrued = userPositions[0]?.dueTokensAccrued || 0;
    const debt = userPositions.reduce((prev, curr) => prev + (curr.debt), 0);
    const creditLimit = userPositions.reduce((prev, curr) => prev + (curr.creditLimit), 0);
    const liquidatableDebt = userPositions.reduce((prev, curr) => prev + (curr.liquidatableDebt), 0);
    const dbrPos = activeDbrHolders.find(p => p.user === user);
    const dailyBurn = debt / oneYear * ONE_DAY_MS;
    const dbrNbDaysExpiry = dailyBurn ? (dbrPos?.signedBalance || 0) / dailyBurn : 0;
    const dbrExpiryDate = !debt ? null : (now + dbrNbDaysExpiry * ONE_DAY_MS);
    return {
      user,
      depositsUsd: userPositions.reduce((prev, curr) => prev + (curr.tvl), 0),
      liquidatableDebt,
      isLiquidatable: liquidatableDebt > 0,
      debt,
      avgBorrowLimit: debt > 0 ? 100 - (userPositions.reduce((prev, curr) => prev + curr.debtRiskWeight, 0) / debt) : 0,
      marketIcons: userPositions?.map(p => p.market.underlying.image) || [],
      marketRelativeDebtSizes: userPositions?.map(p => p.debt > 0 ? p.debt / debt : 0),
      marketUnderlyings: userPositions?.map(p => p.market.underlying),
      marketRelativeCollateralSizes: userPositions?.map(p => p.creditLimit > 0 ? p.creditLimit / creditLimit : 0),
      creditLimit: userPositions.reduce((prev, curr) => prev + (curr.creditLimit), 0),
      stakedInv: userPositions.filter(p => p.market.isInv).reduce((prev, curr) => prev + (curr.deposits), 0),
      stakedInvUsd: userPositions.filter(p => p.market.isInv).reduce((prev, curr) => prev + (curr.tvl), 0),
      dailyBurn,
      dueTokensAccrued,
      dbrNbDaysExpiry,
      dbrExpiryDate,
      dbrSignedBalance: dbrPos?.signedBalance || 0,
      dbrRiskColor: debt > 0 ? getDBRRiskColor(dbrExpiryDate, now) : undefined,
      marketPositions: userPositions,
    }
  });

  return {
    userPositions: positionsAggregatedByUser,
    positions,
    timestamp,
    isLoading: isLoadingDbr || isLoadingPositions,
    isError: error || isErrorPositions,
  }
}

export const useDBRActiveHolders = (): SWR & {
  positions: any,
  timestamp: number,
  isLoading: boolean,
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/dbr-deficits?v2`, fetcher60sectimeout);
  const { positions: firmPositions } = useFirmPositions();

  const activeDbrHolders = data ? data.activeDbrHolders : [];

  const activeDbrHoldersWithMarkets = activeDbrHolders.map(s => {
    const marketPositions = (firmPositions?.filter(p => p.user === s.user) || []).sort((a, b) => b.debt - a.debt);
    const marketIcons = marketPositions?.map(p => p.market.underlying.image) || [];
    const dailyBurn = s.debt / oneYear * ONE_DAY_MS;
    const monthlyBurn = dailyBurn * 365 / 12;
    const dbrNbDaysExpiry = dailyBurn ? s.signedBalance / dailyBurn : 0;
    const dbrExpiryDate = !s.debt ? null : (+new Date() + dbrNbDaysExpiry * ONE_DAY_MS);
    return {
      ...s,
      marketPositions,
      marketIcons,
      dailyBurn,
      monthlyBurn,
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

export const useDBRPendingRewards = (): SWR & {
  stakers: any,
  timestamp: number,
  invMarket: F2Market,
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/dbr-pending-rewards`, fetcher60sectimeout);
  const { data: spendersData, error: spendersError } = useCacheFirstSWR(`/api/f2/dbr-deficits?v2`, fetcher60sectimeout);

  const userData = data ? data.userData : [];
  const activeDbrHolders = spendersData ? spendersData.activeDbrHolders : [];

  const stakers = userData.map(u => {
    const spender = activeDbrHolders.find(p => p.user === u.user) || { debt: 0, signedBalance: 0 };
    const dailyBurn = spender.debt / oneYear * ONE_DAY_MS;
    const dbrNbDaysExpiry = dailyBurn ? spender.signedBalance / dailyBurn : 0;
    const dbrExpiryDate = !spender.debt ? null : (+new Date() + dbrNbDaysExpiry * ONE_DAY_MS);
    const share = data.invMarket.invStakedViaDistributor ? (u.deposits || 0) / data.invMarket.invStakedViaDistributor : 0;
    const invMonthlyRewards = getMonthlyRate((u.deposits || 0), data.invMarket?.supplyApy);
    const dbrMonthlyRewards = share * data.invMarket?.dbrYearlyRewardRate / 12;
    return {
      ...u,
      totalDebt: spender.debt,
      dailyBurn,
      monthlyBurn: dailyBurn * 365 / 12,
      dbrExpiryDate,
      invMonthlyRewards,
      dbrMonthlyRewards,
    }
  });

  return {
    stakers,
    invMarket: data ? data.invMarket : {},
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
const COMBINATIONS_LEVERAGE = {
  'Deposit': 'LeverageUp',
  'Borrow': 'LeverageUp',
  'Withdraw': 'LeverageDown',
  'Repay': 'LeverageDown',
}
const COMBINATIONS_NAMES = {
  'Deposit': 'DepositBorrow',
  'Borrow': 'DepositBorrow',
  'Repay': 'RepayWithdraw',
  'Withdraw': 'RepayWithdraw',
}

export const useFirmMarketEvents = (market: F2Market, account: string, firmActionIndex: number): {
  events: FirmAction[]
  isLoading: boolean
  error: any
  depositedByUser: number
  currentCycleDepositedByUser: number
  liquidated: number
  lastBlock: number
  depositsOnTopOfLeverageEvents: any[]
  repaysOnTopOfDeleverageEvents: any[]
} => {
  const eventQueries = [
    [market.address, F2_MARKET_ABI, 'Deposit', [account]],
    [market.address, F2_MARKET_ABI, 'Withdraw', [account]],
    [market.address, F2_MARKET_ABI, 'Borrow', [account]],
    [market.address, F2_MARKET_ABI, 'Repay', [account]],
    [market.address, F2_MARKET_ABI, 'Liquidate', [account]],
    // [market.address, F2_MARKET_ABI, 'CreateEscrow', [account]],
    [DBR, DBR_ABI, 'ForceReplenish', [account, undefined, market.address]],
  ];
  const needAleEvents = FEATURE_FLAGS.firmLeverage && market.hasAleFeat;
  if (needAleEvents) {
    eventQueries.push([F2_ALE, F2_ALE_ABI, 'LeverageUp', [market.address, account]]);
    eventQueries.push([F2_ALE, F2_ALE_ABI, 'LeverageDown', [market.address, account]]);
  }
  const { groupedEvents, isLoading, error } = useMultiContractEvents(
    eventQueries,
    `firm-market-${market.address}-${account}-${firmActionIndex}`,
  );
  const { events: depositsOnTopOfLeverageEvents } = useContractEvents(
    market.collateral, ERC20_ABI, 'Transfer', needAleEvents ? [account, F2_ALE] : undefined, true, `ale-${account}-deposits-on-top--${firmActionIndex}`
  );

  const { events: repaysOnTopOfDeleverageEvents } = useContractEvents(
    DOLA, ERC20_ABI, 'Transfer', needAleEvents ? [account, F2_ALE] : undefined, true, `ale-${account}-repays-on-top-${firmActionIndex}`
  );

  const flatenedEvents = groupedEvents.flat().sort(ascendingEventsSorter);
  const lastTxBlockFromLast1000 = useBlockTxFromLast1000(market, account);

  // can be different than current balance when staking
  let depositedByUser = 0;
  // originally deposited in the current "cycle" (new cycle = deposit goes from 0 to > 0)
  let currentCycleDepositedByUser = 0;
  let liquidated = 0;

  const events = flatenedEvents.map(e => {
    const isCollateralEvent = ['Deposit', 'Withdraw', 'Liquidate'].includes(e.event);
    const isLeverageEvent = ['LeverageUp', 'LeverageDown'].includes(e.event);
    const decimals = isCollateralEvent ? market.underlying.decimals : 18;

    // Deposit can be associated with Borrow, withdraw with repay
    let combinedEvent, leverageEvent;
    const combinedEventName = COMBINATIONS[e.event];
    const leverageCombinedEventName = COMBINATIONS_LEVERAGE[e.event];
    if (combinedEventName) {
      combinedEvent = flatenedEvents.find(e2 => e.transactionHash === e2.transactionHash && e2.event === combinedEventName);
    }
    if (leverageCombinedEventName) {
      leverageEvent = flatenedEvents.find(e2 => e.transactionHash === e2.transactionHash && e2.event === leverageCombinedEventName);
    } else if (isLeverageEvent) {
      leverageEvent = e;
    }

    const tokenName = isCollateralEvent ? market.underlying.symbol : e.args?.replenisher ? 'DBR' : 'DOLA';
    const actionName = !!leverageEvent ? leverageEvent.event : !!combinedEvent ? COMBINATIONS_NAMES[e.event] : e.event;

    const amount = e.args?.amount ? getBnToNumber(e.args?.amount, decimals) : undefined;
    const liquidatorReward = e.args?.liquidatorReward ? getBnToNumber(e.args?.liquidatorReward, decimals) : undefined;

    const dolaFlashMinted = !!leverageEvent ? getBnToNumber(leverageEvent.args?.dolaFlashMinted) : 0;
    const collateralLeveragedAmount = !!leverageEvent ? getBnToNumber(leverageEvent.args[3], market.underlying.decimals) : 0;

    if (isCollateralEvent && !!amount) {
      const colDelta = (e.event === 'Deposit' ? amount : -amount);
      depositedByUser = depositedByUser + colDelta;
      currentCycleDepositedByUser = currentCycleDepositedByUser + colDelta;
      if (currentCycleDepositedByUser < 0) {
        currentCycleDepositedByUser = 0;
      }
    } else if (e.event === 'Liquidate' && !!liquidatorReward) {
      liquidated += liquidatorReward;
    }

    const depositOnTopOfLeverageEvent = actionName === 'LeverageUp' ? depositsOnTopOfLeverageEvents?.find(e2 => e2.transactionHash.toLowerCase() === e.transactionHash.toLowerCase()) : undefined;
    const depositOnTopOfLeverage = depositOnTopOfLeverageEvent ? getBnToNumber(depositOnTopOfLeverageEvent.args.amount, market.underlying.decimals) : 0;
    const repayOnTopOfDeleverageEvent = actionName === 'LeverageDown' ? repaysOnTopOfDeleverageEvents?.find(e2 => e2.transactionHash.toLowerCase() === e.transactionHash.toLowerCase()) : undefined;
    const repayOnTopOfDeleverage = repayOnTopOfDeleverageEvent ? getBnToNumber(repayOnTopOfDeleverageEvent.args.amount) : 0;

    return {
      combinedKey: `${e.transactionHash}-${actionName}-${e.args?.account}`,
      actionName,
      blockNumber: e.blockNumber,
      txHash: e.transactionHash,
      amount,
      isLeverage: !!leverageEvent,
      isCombined: !!combinedEvent || !!leverageEvent,
      amountCombined: combinedEvent?.args?.amount ? getBnToNumber(combinedEvent.args.amount, !isCollateralEvent ? market.underlying.decimals : 18) : undefined,
      deficit: e.args?.deficit ? getBnToNumber(e.args?.deficit, 18) : undefined,
      repaidDebt: e.args?.repaidDebt ? getBnToNumber(e.args?.repaidDebt, 18) : undefined,
      liquidatorReward,
      repayer: e.args?.repayer,
      to: e.args?.to,
      escrow: e.args?.escrow,
      replenisher: e.args?.replenisher,
      name: e.event,
      nameCombined: !!leverageEvent ? leverageCombinedEventName : combinedEventName,
      logIndex: e.logIndex,
      isCollateralEvent,
      tokenName,
      tokenNameCombined: tokenName === 'DOLA' ? market.underlying.symbol : 'DOLA',
      dolaFlashMinted,
      collateralLeveragedAmount,
      depositOnTopOfLeverage,
      repayOnTopOfDeleverage,
    }
  });

  const grouped = uniqueBy(events, (o1, o2) => o1.combinedKey === o2.combinedKey);
  const blocks = events.map(e => e.blockNumber);
  grouped.sort((a, b) => a.blockNumber !== b.blockNumber ? (b.blockNumber - a.blockNumber) : b.logIndex - a.logIndex);

  return {
    events: grouped,
    depositedByUser,
    currentCycleDepositedByUser,
    liquidated,
    lastBlock: blocks?.length ? Math.max(...blocks) : lastTxBlockFromLast1000,
    depositsOnTopOfLeverageEvents,
    repaysOnTopOfDeleverageEvents,
    isLoading,
    error,
  }
}

export const useDBRReplenishments = (account?: string): SWR & {
  events: any,
  timestamp: number,
  isLimited: boolean,
} => {
  const { data, error } = useCustomSWR(`/api/f2/dbr-replenishments?account=${account||''}`, fetcher);
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
    isLimited: data?.isLimited || false,
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRBurns = (): SWR & {
  events: any,
  timestamp: number,
} => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/dbr-burns?`);

  return {
    events: data ? data.totalBurns : [],
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBREmissions = (): SWR & {
  events: any,
  timestamp: number,
  rewardRatesHistory: {
    timestamp: number,
    rates: { timestamp: number, rewardRate: number }[],
  }
} => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/dbr-emissions?v=2`);

  return {
    events: data ? data.totalEmissions : [],
    rewardRatesHistory: data ? data.rewardRatesHistory : { rates: [] },
    timestamp: data ? data.timestamp : 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDBRDebtHisto = (): SWR & {
  timestamp: number,
  history: { debt: number, timestamp: number }[],
} => {
  const { data, error } = useCacheFirstSWR(`/api/f2/debt-histo?v1.0.7b`);

  const debts = data?.debts || [];
  const history = debts
    .map((d, i) => {
      return {
        debt: d.reduce((a, b) => a + b, 0),
        timestamp: data.timestamps[i] * 1000,
      }
    })
    .filter((d, i) => !!d.timestamp)

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
  // temporary disabled
  const dbrSimData = undefined;
  // const { data: dbrSimData } = useCustomSWR(escrow && escrow !== BURN_ADDRESS ? `/api/f2/sim-dbr-rewards?escrow=${escrow}&account=${account}` : '-', fetcher30sectimeout);
  const { data, error } = useEtherSWR({
    args: [[escrow, 'claimable']],
    abi: F2_ESCROW_ABI,
  });
  const { data: rewardRateBn } = useEtherSWR([DBR_DISTRIBUTOR, 'rewardRate']);
  const { data: lastUpdate } = useEtherSWR([DBR_DISTRIBUTOR, 'lastUpdate']);
  const { data: totalSupplyBn } = useEtherSWR([DBR_DISTRIBUTOR, 'totalSupply']);

  const lastUpdateStored = lastUpdate ? getBnToNumber(lastUpdate, 0) * 1000 : 0;
  const storedIsOutdated = !!data && !!dbrSimData && lastUpdateStored < dbrSimData?.timestamp;

  // per second
  const rewardRate = rewardRateBn ? getBnToNumber(rewardRateBn) : 0;
  const yearlyRewardRate = rewardRate * ONE_DAY_SECS * 365;
  const { priceUsd: dbrPriceUsd } = useDBRPrice();

  const rewardsStored = data && data[0] ? getBnToNumber(data[0]) : 0;
  const rewards = storedIsOutdated ? dbrSimData?.simRewards : rewardsStored;
  const totalSupply = totalSupplyBn ? getBnToNumber(totalSupplyBn) : 0;

  const apr = !totalSupply ? 0 : yearlyRewardRate / totalSupply;

  const rewardsInfos = {
    timestamp: storedIsOutdated ? dbrSimData?.timestamp : lastUpdateStored,
    tokens: [
      {
        metaType: 'claimable',
        balanceUSD: rewards * dbrPriceUsd,
        price: dbrPriceUsd,
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

export const useCvxFxsRewards = (escrow: string) => {
  const { prices } = usePrices();
  const { data: rewardsData, error } = useEtherSWR({
    args: !!escrow && escrow !== BURN_ADDRESS ? [
      ['0x49b4d1dF40442f0C31b1BbAEA3EDE7c38e37E31a', 'claimableRewards', escrow],
    ] : [[]],
    abi: ['function claimableRewards(address) view returns (tuple(address rewardToken, uint amount)[])'],
  });

  const rewards = rewardsData?.[0]?.map(r => {
    const token = getToken(TOKENS, r.rewardToken);
    const balance = getBnToNumber(r.amount, token.decimals);
    const price = prices && prices[token.coingeckoId] ? prices[token.coingeckoId].usd : 0;
    return {
      metaType: 'claimable',
      balanceUSD: balance * price,
      price,
      balance,
      address: r.rewardToken,
    }
  });

  return {
    rewardsInfos: {
      tokens: rewards || [],
      timestamp: Date.now(),
    },
    isLoading: !rewardsData && !error,
    isError: error,
  }
}

export const useCvxCrvRewards = (escrow: string) => {
  const { prices } = usePrices();

  const { provider } = useWeb3React();
  const tsMinute = (new Date()).toISOString().substring(0, 16);
  const { data: rewardsData, error } = useSWR(`cvxCrv-rewards-${escrow}-${tsMinute}`, async () => {
    return !escrow || escrow === BURN_ADDRESS ? Promise.resolve(undefined) : await getCvxCrvRewards(escrow, provider?.getSigner());
  });

  const rewards = rewardsData?.map(r => {
    const token = getToken(TOKENS, r.token);
    const balance = getBnToNumber(r.amount, token.decimals);
    const price = prices && prices[token.coingeckoId] ? prices[token.coingeckoId].usd : 0;
    return {
      metaType: 'claimable',
      balanceUSD: balance * price,
      price,
      balance,
      address: r.token,
    }
  });

  return {
    rewardsInfos: {
      tokens: rewards || [],
      timestamp: Date.now(),
    },
    isLoading: !rewardsData && !error,
    isError: error,
  }
}

export const useConvexLpRewards = (escrow: string, rewardContract: string) => {
  const { prices } = usePrices();

  const { provider } = useWeb3React();
  const tsMinute = (new Date()).toISOString().substring(0, 16);
  const { data: rewardsData, error } = useSWR(`convex-lp-rewards-${escrow}-${tsMinute}`, async () => {
    return !escrow || escrow === BURN_ADDRESS ? Promise.resolve(undefined) : await getConvexLpRewards(escrow, rewardContract, provider?.getSigner());
  });

  const crv = getToken(TOKENS, 'CRV')!;
  const cvx = getToken(TOKENS, 'CVX')!;
  const crvBalance = rewardsData ? getBnToNumber(rewardsData?.earned, crv.decimals) : 0;
  const cvxBalance = rewardsData ? rewardsData?.cvxReward : 0;
  const crvPrice = prices && prices[crv.coingeckoId!] ? prices[crv.coingeckoId!].usd : 0;
  const cvxPrice = prices && prices[cvx.coingeckoId!] ? prices[cvx.coingeckoId!].usd : 0;

  const rewards = [
    {
      metaType: 'claimable',
      balanceUSD: crvBalance * crvPrice,
      price: crvPrice,
      balance: crvBalance,
      address: crv.address,
    },
    {
      metaType: 'claimable',
      balanceUSD: cvxBalance * cvxPrice,
      price: cvxPrice,
      balance: cvxBalance,
      address: cvx.address,
    }
  ];

  return {
    rewardsInfos: {
      tokens: rewards || [],
      timestamp: Date.now(),
    },
    isLoading: !rewardsData && !error,
    isError: error,
  }
}

export const useCvxRewards = (escrow: string) => {
  const { prices } = usePrices();

  const { provider } = useWeb3React();
  const tsMinute = (new Date()).toISOString().substring(0, 16);
  const { data: rewardsData, error } = useSWR(`cvx-rewards-${escrow}-${tsMinute}`, async () => {
    return !escrow || escrow === BURN_ADDRESS ? Promise.resolve(undefined) : await getCvxRewards(escrow, provider?.getSigner());
  });

  const token = getToken(TOKENS, 'cvxCRV')!;
  const balance = rewardsData ? getBnToNumber(rewardsData?.earned, token.decimals) : 0;
  const price = prices && prices[token.coingeckoId!] ? prices[token.coingeckoId!].usd : 0;

  const rewards = [{
    metaType: 'claimable',
    balanceUSD: balance * price,
    price,
    balance,
    address: token.address,
  }];

  return {
    rewardsInfos: {
      tokens: rewards || [],
      timestamp: Date.now(),
    },
    extraRewards: rewardsData?.extraRewards || [],
    isLoading: !rewardsData && !error,
    isError: error,
  }
}

export const useEscrowRewards = (escrow: string): SWR & {
  appGroupPositions: any[],
  timestamp: number,
} => {
  const { data, error } = useCacheFirstSWR(escrow && escrow !== BURN_ADDRESS ? `/api/f2/escrow-rewards?escrow=${escrow || ''}` : '-');

  return {
    appGroupPositions: data?.appGroupPositions || [],
    timestamp: data?.timestamp || 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useUserRewards = (user: string): SWR & {
  appGroupPositions: any[],
  timestamp: number,
} => {
  const { data, error } = useCacheFirstSWR(!user ? '-' : `/api/f2/user-rewards?user=${user || ''}`);

  return {
    appGroupPositions: data?.appGroupPositions || [],
    timestamp: data?.timestamp || 0,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useEscrowBalance = (escrow: string, decimals = 18): {
  balance: number,
  isLoading: boolean,
} => {
  const { data: firmEscrowData, error: firmEscrowError } = useEtherSWR({
    args: !!escrow && escrow !== BURN_ADDRESS ? [
      [escrow, 'balance'],
    ] : [[]],
    abi: F2_ESCROW_ABI,
  });
  const balance = firmEscrowData && firmEscrowData[0] ? getBnToNumber(firmEscrowData[0], decimals) : 0;

  return {
    balance,
    isLoading: (!firmEscrowData && !firmEscrowError),
  };
}

export const useStakedInFirm = (userAddress: string): {
  stakedInFirm: number,
  escrow: string,
  delegate: string,
  isLoading: boolean,
  isInvPrimeMember: boolean,
} => {
  const firmInv = F2_MARKETS.find(m => m.isInv);

  const { data: escrow, error: escrowError } = useEtherSWR(!!firmInv && !!userAddress ? [firmInv.address, 'escrows', userAddress] : []);
  const { data, error: invDelError } = useEtherSWR([
    [INV, 'delegates', escrow],
  ]);

  const { data: firmEscrowData, error: firmEscrowError } = useEtherSWR({
    args: !!escrow && escrow !== BURN_ADDRESS ? [
      [escrow, 'balance'],
    ] : [[]],
    abi: F2_ESCROW_ABI,
  });
  const stakedInFirm = firmEscrowData && firmEscrowData[0] ? getBnToNumber(firmEscrowData[0]) : 0;

  return {
    isInvPrimeMember: isInvPrimeMember(stakedInFirm),
    stakedInFirm,
    escrow,
    delegate: data ? data[0] : '',
    isLoading: (!invDelError && !data) || (!escrow && !escrowError) || (!firmEscrowData && !firmEscrowError),
  };
}

export const useAccountRewards = (account: string, invMarket: F2Market) => {
  const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
  const { prices } = usePrices();
  const { price: dolaPriceUsd } = useDOLAPrice();

  const { stakedInFirm } = useStakedInFirm(account);
  const { apy: sDolaApy, sDolaExRate } = useStakedDola(dbrPrice);

  const { apy: sInvApyV2 } = useStakedInv(dbrDolaPrice);
  const { apy: sInvApyV1 } = useStakedInv(dbrDolaPrice, 'V1');

  const { assets: invStakedInSInvV2 } = useStakedInvBalance(account);
  const { assets: invStakedInSInvV1 } = useStakedInvBalance(account, 'V1');

  const { stakedDolaBalance } = useDolaStakingEarnings(account);
  const dolaStakedInSDola = sDolaExRate * stakedDolaBalance;

  const share = !invMarket ? 0 : invMarket.invStakedViaDistributor ? stakedInFirm / invMarket.invStakedViaDistributor : 0;

  const invMonthlyRewardsFromFirm = getMonthlyRate(stakedInFirm, invMarket?.supplyApy);
  const invMonthlyRewardsFromSInv = getMonthlyRate(invStakedInSInvV1, sInvApyV1) + getMonthlyRate(invStakedInSInvV2, sInvApyV2);
  
  const invMonthlyRewards = invMonthlyRewardsFromFirm + invMonthlyRewardsFromSInv;
  const dbrMonthlyRewards = share * invMarket?.dbrYearlyRewardRate / 12;
  const dolaMonthlyRewards = sDolaApy > 0 && dolaStakedInSDola > 0 ? getMonthlyRate(dolaStakedInSDola, sDolaApy) : 0;

  const invPriceCg = prices ? prices['inverse-finance']?.usd : 0;
  const { priceUsd: dbrPriceUsd } = useDBRPrice();

  return {
    invMonthlyRewards,
    dbrMonthlyRewards,
    dolaMonthlyRewards,
    invMonthlyRewardsFromFirm,
    invMonthlyRewardsFromSInv,
    invMonthlyRewardsUsd: invMonthlyRewards * invPriceCg,
    dbrMonthlyRewardsUsd: dbrMonthlyRewards * dbrPriceUsd,
    dolaMonthlyRewardsUsd: dolaMonthlyRewards * dolaPriceUsd,
    invPrice: invPriceCg,
    dbrPrice: dbrPriceUsd,
    dolaPrice: dolaPriceUsd,
    totalRewardsUsd: invMonthlyRewards * invPriceCg + dbrMonthlyRewards * dbrPriceUsd + dolaMonthlyRewards * dolaPriceUsd,
  }
}

export const useHistoricalPrices = (cgId: string) => {
  const { data, error } = useCustomSWR(`cg-histo-prices-${cgId}`, async () => {
    return await getHistoricalTokenData(cgId);
  });

  return {
    prices: data?.prices || [],
    isLoading: !error && !data,
    isError: !!error,
  }
}

export const useHistoOraclePrices = (marketAddress: string): {
  timestamp: number,
  evolution: [number, number][],
  prices: number[],
  blocks: number[],
  timestamps: number[],
  isLoading: boolean,
  isError: boolean,
} => {
  const { data, error } = useCacheFirstSWR(!marketAddress ? '-' : `/api/f2/histo-oracle-prices?v=1.2&market=${marketAddress}`, fetcher);

  return {
    evolution: data?.timestamps?.map((t, i) => [data.timestamps[i], data.oraclePrices[i], data.collateralFactors[i]]) || [],
    timestamp: data?.timestamp || 0,
    prices: data?.oraclePrices || [],
    blocks: data?.blocks || [],
    timestamps: data?.timestamps || [],
    isLoading: !error && !data,
    isError: !!error,
  }
}

export const useEscrowBalanceEvolution = (account: string, escrow: string, market: string, firmActionIndex: number): SWR & {
  evolution: { balance: number, timestamp: number, debt: number, blocknumber: number, dbrClaimable: number }[],
  formattedEvents: any[],
  timestamps: { [key: string]: number },
  timestamp: number,
  debt: number,
  liquidated: number,
  claims: number,
  depositedByUser: number,
  firmActionIndex: number,
  isLoading: boolean,
  isError: boolean,
} => {
  const { data, error, isLoading } = useCacheFirstSWR(!account || (!escrow || escrow === BURN_ADDRESS) || (typeof firmActionIndex !== 'number') ? '-' : `/api/f2/escrow-balance-histo?v=1.1.1&account=${account}&escrow=${escrow}&market=${market}&firmActionIndex=${firmActionIndex}`, fetcher60sectimeout);

  const evolution = data?.balances?.map((b, i) => ({
    balance: b,
    dbrClaimable: data.dbrClaimables[i],
    blocknumber: data.blocks[i],
    debt: data.debts[i],
    timestamp: data.timestamps[i],
  })) || [];

  const timestamps = evolution.reduce((acc, e) => ({ ...acc, [e.blocknumber]: e.timestamp }), {});

  return {
    ...data,
    evolution,
    timestamps,
    formattedEvents: data?.formattedEvents || [],
    isLoading,
    isError: !!error,
  }
}

// last block if a tx happened last 999 blocks
export const useBlockTxFromLast1000 = (market: F2Market, account: string) => {
  const { data: latestBlockData } = useEtherSWR(
    ['getBlock']
  );

  const latestBlock = latestBlockData?.number || 0;
  // for wallets not supporting much events
  const { groupedEvents: groupedRecentEvents } = useMultiContractEvents([
    [market.address, F2_MARKET_ABI, 'Deposit', [account]],
    [market.address, F2_MARKET_ABI, 'Withdraw', [account]],
    [market.address, F2_MARKET_ABI, 'Borrow', [account]],
    [market.address, F2_MARKET_ABI, 'Repay', [account]],
    [market.address, F2_MARKET_ABI, 'Liquidate', [account]],
    [DBR, DBR_ABI, 'ForceReplenish', [account, undefined, market.address]],
  ], `firm-market-recent-${market.address}-${account}-${latestBlock}`, latestBlockData ? latestBlockData?.number - 999 : undefined, latestBlockData ? latestBlockData?.number : undefined);

  const flatenedRecentEvents = groupedRecentEvents.flat();
  const blocks = flatenedRecentEvents.map(e => e.blockNumber);
  return blocks?.length ? Math.max(...blocks) : 0;
}

export const useFirmMarketEvolution = (market: F2Market, account: string): {
  events: FirmAction[]
  isLoading: boolean
  error: any
  depositedByUser: number
  liquidated: number
  lastBlock: number
} => {
  const toQuery = [
    [market.address, F2_MARKET_ABI, 'Deposit', [account]],
    [market.address, F2_MARKET_ABI, 'Withdraw', [account]],
    [market.address, F2_MARKET_ABI, 'Borrow', [account]],
    [market.address, F2_MARKET_ABI, 'Repay', [account]],
    [DBR, DBR_ABI, 'ForceReplenish', [account, undefined, market.address]],
    [market.address, F2_MARKET_ABI, 'Liquidate', [account]],
  ];

  if (market.isInv) {
    // DBR transfers = dbr claims, only for the INV market
    toQuery.push([DBR, DBR_ABI, 'Transfer', [BURN_ADDRESS, account]])
  }
  const needAleEvents = FEATURE_FLAGS.firmLeverage && market.hasAleFeat;
  if (needAleEvents) {
    toQuery.push([F2_ALE, F2_ALE_ABI, 'LeverageUp', [market.address, account]]);
    toQuery.push([F2_ALE, F2_ALE_ABI, 'LeverageDown', [market.address, account]]);
  }

  const { groupedEvents, isLoading, error } = useMultiContractEvents(
    toQuery,
    `firm-market-${market.address}-${account}-collateral-evo`,
  );

  const lastTxBlockFromLast1000 = useBlockTxFromLast1000(market, account);

  const flatenedEvents = groupedEvents.flat().sort(ascendingEventsSorter);

  const blocks = flatenedEvents.map(e => e.blockNumber);
  // useBlocksTimestamps won't work for older events for some wallets/rpc, fallback is via backend api
  const { timestamps } = useBlocksTimestamps(blocks);

  const { events, debt, depositedByUser, liquidated, replenished, lastBlock } = formatFirmEvents(market, flatenedEvents, timestamps);

  return {
    events,
    debt,
    depositedByUser,
    liquidated,
    replenished,
    lastBlock: lastBlock || lastTxBlockFromLast1000,
    isLoading,
    error,
  }
}

export const useFirmLiquidations = (user?: string): SWR & {
  liquidations: { borrower: string, liquidator: string, repaidDebt: number, liquidatorReward: number, txHash: string, timestamp: number, market: F2Market }[],
  timestamp: number,
  isLoading: boolean,
  isError: boolean,
} => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/firm-liquidations?borrower=${user || ''}`);

  const liquidations = (data?.liquidations || []).map(d => {
    const market = F2_MARKETS.find(m => m.address.toLowerCase() === d.marketAddress.toLowerCase());
    return {
      ...d,
      marketName: market.name,
      market: {
        ...market,
        underlying: TOKENS[market.collateral],
      }
    }
  });

  return {
    timestamp: data?.timestamp || 0,
    liquidations,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFirmAffiliate = (affiliate: string, updateIndex = 0) => {
  const { data, error } = useCustomSWR(`/api/referral?updateIndex=${updateIndex||0}`, fetcher);
  const referrals = (data?.referrals || []).filter(d => affiliate === 'all' || d.affiliate.toLowerCase() === affiliate?.toLowerCase());
  return {
    timestamp: data?.timestamp,
    referrals,
    referralAddresses: referrals.map(d => d.referred),
    affiliatePaymentEvents: data?.affiliatePaymentEvents || [],
    affiliateAddresses: data?.affiliateAddresses || [],
    affiliatesPublicData: data?.affiliatesPublicData || [],
  }
}