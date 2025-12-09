import { FedEvent, SWR, StabilizerEvent, DAO, Payroll, Vester, Fed, NetworkIds, LiquidityPoolAggregatedData } from '@app/types'
import { getNetworkConfigConstants } from '@app/util/networks';
import { fetcher } from '@app/util/web3'
import { useCacheFirstSWR, useCustomSWR } from './useCustomSWR';
import { ONE_DAY_MS } from '@app/config/constants';
import { getDateChartInfo } from './misc';
import { fillMissingDailyDatesWithMostRecentData, timestampToUTC } from '@app/util/misc';
import { useState } from 'react';

const { FEDS, DEPLOYER, TREASURY } = getNetworkConfigConstants();

const defaultFedsData = FEDS.map(((fed) => {
  return {
    ...fed,
    events: [],
    supply: 0,
    chair: DEPLOYER,
    gov: TREASURY,
  }
}))

export const useStableReserves = (): SWR & { stableReservesEvolution: any[] } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/stable-reserves-history`, fetcher)
  return {
    stableReservesEvolution: (data?.totalEvolution || [])
      .filter(d => d.utcDate !== (new Date().toISOString().substring(0, 10)))
      .map(d => ({...d, x: d.timestamp, y: d.totalReserves})),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useDAO = (): SWR & DAO => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/dao?v=7`, fetcher)

  return {
    dolaTotalSupply: data?.dolaTotalSupply || 0,
    invTotalSupply: data?.invTotalSupply || 0,
    dolaOperator: data?.dolaOperator || '',
    treasury: data?.treasury || [],
    bonds: data?.bonds || { balances: [] },
    anchorReserves: data?.anchorReserves || [],
    dolaSupplies: data?.dolaSupplies || [],
    invSupplies: data?.invSupplies || [],
    feds: data?.feds || defaultFedsData,
    multisigs: (data?.multisigs?.sort((a, b) => a.order - b.order) || []),
    pols: data?.pols || [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useTreasuryAssets = (): SWR & { treasury: any[], anchorReserves: any[], multisigs: any[] } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/treasury-assets`, fetcher)

  return {
    treasury: data?.treasury || [],
    bonds: data?.bonds || { balances: [] },
    anchorReserves: data?.anchorReserves || [],
    multisigs: (data?.multisigs?.sort((a, b) => a.order - b.order) || []),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useLiquidityPools = (): SWR & { liquidity: any[], timestamp: number } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/liquidity?v=1`)

  return {
    timestamp: data?.timestamp,
    liquidity: data?.liquidity || [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useLiquidityPoolsAggregatedHistory = (excludeCurrent = false, chainId = ''): SWR & {
  aggregatedHistory: {
    "DOLA": LiquidityPoolAggregatedData[]
    "DOLA-stable": LiquidityPoolAggregatedData[]
    "DOLA-volatile": LiquidityPoolAggregatedData[]
    "INV": LiquidityPoolAggregatedData[]
    "INV-DOLA": LiquidityPoolAggregatedData[]
    "INV-NON_DOLA": LiquidityPoolAggregatedData[]
    "DBR": LiquidityPoolAggregatedData[]
    "DBR-DOLA": LiquidityPoolAggregatedData[]
    "DBR-NON_DOLA": LiquidityPoolAggregatedData[]
    "sDOLA": LiquidityPoolAggregatedData[]
    "sDOLA-DOLA": LiquidityPoolAggregatedData[]
    "sDOLA-NON_DOLA": LiquidityPoolAggregatedData[]
  },
} => {
  const { data, error } = useCustomSWR(`/api/transparency/liquidity-histo?excludeCurrent=${excludeCurrent}&chainId=${chainId}`, fetcher)

  return {
    aggregatedHistory: data?.aggregatedHistory || {},
    isLoading: !error && !data,
    isError: error,
  }
}

export const useCompensations = (): SWR & {
  currentPayrolls: Payroll[]
  currentVesters: Vester[]
  currentInvBalances: { address: string, totalInvBalance: number }[]
  payrollEvolution: { timestamp: number, utcDate: string, total: number, nbRecipients: number, x: number, y: number }[]
} => {
  const [now, setNow] = useState(Date.now());
  const { data, error } = useCacheFirstSWR(`/api/transparency/compensations?v=4`, fetcher)
  const evo = (data?.payrollTotalEvolutionByDay || []).map(d => ({ ...d, x: d.timestamp, y: d.total }));
  const evoPlusToday = evo.concat({ ...evo[evo.length - 1], timestamp: now, utcDate: timestampToUTC(now) });

  return {
    isLoading: !error && !data,
    isError: error,
    currentPayrolls: data?.currentPayrolls || [],
    currentVesters: data?.currentVesters || [],
    currentInvBalances: data?.currentInvBalances || [],
    payrollEvolution: evoPlusToday,
  }
}

const addFedInfosToEvent = (totalEvents, feds) => {
  return totalEvents
    .filter(e => !!feds[e.fedIndex])
    .map(e => {
      const fed = feds[e.fedIndex];
      return {
        ...e,
        chainId: fed.chainId,
        fedName: fed.name,
        shortname: fed.name.replace(/ Fed$/, ''),
        projectImage: fed.projectImage,
      }
    })
}

export const useFedHistory = (): SWR & {
  totalEvents: FedEvent[],
  fedPolicyMsg: { msg: string, lastUpdate: number },
  feds: (Fed & { supply: number })[],
  dolaSupplies: { chainId: string, supply: number }[],
} => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/fed-policy?v=2`)

  const totalEvents = data?.totalEvents || [];

  return {
    totalEvents: addFedInfosToEvent(totalEvents, data?.feds || []),
    fedPolicyMsg: data?.fedPolicyMsg || { msg: 'No guidance at the moment', lastUpdate: null },
    feds: data?.feds || [],
    dolaSupplies: Array.isArray(data?.dolaSupplies) ? data?.dolaSupplies : [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFedIncome = (): SWR & { totalEvents: FedEvent[], totalFedsIncomes: { [key: string]: number } } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/fed-income?v=4`)

  const totalEvents = data?.totalEvents || [];
  const totalFedsIncomes = data?.totalFedsIncomes || {};

  return {
    totalEvents: addFedInfosToEvent(totalEvents, data?.feds || []),
    totalFedsIncomes,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFedOverview = (): SWR & { fedOverviews: any[] } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/fed-overview`)

  return {
    fedOverviews: (data?.fedOverviews || []).map(f => ({
      ...f,
      dolaBalance: (f.subBalances?.find(b => b.symbol === 'DOLA')?.balance || 0) * f.lpPol,
      polUsd: f.lpBalance * f.lpPrice,
    })),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useStabilizer = (): SWR & { totalEvents: StabilizerEvent[] } => {
  const { data, error } = useCustomSWR(`/api/transparency/stabilizer`)

  const totalEvents = data?.totalEvents || [];

  return {
    totalEvents,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFedIncomeChartData = (fedHistoricalEvents: FedEvent[], isAllFedsCase = false): SWR & { chartData: any, chartBarData: any } => {
  const now = Date.now();
  const chartData = [...fedHistoricalEvents.sort((a, b) => a.timestamp - b.timestamp).map(event => {
    const date = new Date(event.timestamp);
    return {
      x: event.timestamp,
      y: event[isAllFedsCase ? 'totalAccProfit' : 'accProfit'],
      profit: event.profit,
      month: date.getUTCMonth(),
      year: date.getUTCFullYear(),
    }
  })];

  // add today's timestamp and zero one day before first supply
  const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
  if (chartData.length > 0) {
    chartData.unshift({ x: minX - ONE_DAY_MS, y: 0 });
    chartData.push({ x: now, y: chartData[chartData.length - 1].y });
  }
  const chartBarData = chartData.map(d => ({ ...d, ...getDateChartInfo(d.x) }));
  return {
    chartData: fillMissingDailyDatesWithMostRecentData(
      chartBarData, 1
    ),
    chartBarData,
  }
}

export const useFedPolicyChartData = (fedHistoricalEvents: FedEvent[], isAllFedsCase = false): SWR & { chartData: any } => {
  const now = Date.now();
  const chartData = [...fedHistoricalEvents.sort((a, b) => a.timestamp - b.timestamp).map(event => {
    return {
      x: event.timestamp,
      y: event[isAllFedsCase ? 'newTotalSupply' : 'newSupply'],
    }
  })];

  // add today's timestamp and zero one day before first supply
  const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
  if (chartData.length > 0) {
    chartData.unshift({ x: minX - ONE_DAY_MS, y: 0 });
    chartData.push({ x: now, y: chartData[chartData.length - 1].y });
  }

  return {
    chartData: fillMissingDailyDatesWithMostRecentData(
      chartData.map(d => ({ ...d, ...getDateChartInfo(d.x) })), 1
    )
  }
}

export const useEligibleRefunds = (
  startDate: string,
  endDate: string,
  reloadIndex: number,
  preferCache = false,
  serverFilter = '',
  serverMultisigFilter = '',
): SWR & { transactions: any[], cachedMostRecentTimestamp: number } => {
  const { data, error } = useCustomSWR(`/api/gov/eligible-refunds?v=2&preferCache=${preferCache}&startDate=${startDate}&endDate=${endDate}&reloadIndex=${reloadIndex}&filterType=${serverFilter}&multisig=${serverMultisigFilter}`, (r) => fetcher(r, undefined, 60000))

  return {
    transactions: data?.transactions || [],
    cachedMostRecentTimestamp: data?.cachedMostRecentTimestamp || 0,
    isLoading: !data && !error,
    isError: !!error,
  }
}