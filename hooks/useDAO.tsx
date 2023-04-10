import { FedEvent, SWR, StabilizerEvent, DAO, Payroll, Vester, Fed, NetworkIds } from '@app/types'
import { getNetworkConfigConstants } from '@app/util/networks';
import { fetcher } from '@app/util/web3'
import { useCacheFirstSWR, useCustomSWR } from './useCustomSWR';
import { ONE_DAY_MS } from '@app/config/constants';

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

export const useDAO = (): SWR & DAO => {
  const { data, error } = useCustomSWR(`/api/transparency/dao?v=3`, fetcher)

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

export const useLiquidityPools = (): SWR & { liquidity: any[], timestamp: number } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/liquidity?v=1`, fetcher)

  return {    
    timestamp: data?.timestamp,
    liquidity: data?.liquidity || [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useCompensations = (): SWR & {
  currentPayrolls: Payroll[]
  currentVesters: Vester[]
} => {
  const { data, error } = useCustomSWR(`/api/transparency/compensations`, fetcher)

  return {
    isLoading: !error && !data,
    isError: error,
    currentPayrolls: data?.currentPayrolls || [],
    currentVesters: data?.currentVesters || [],
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
  const { data, error } = useCacheFirstSWR(`/api/transparency/fed-policy?v=2`, fetcher)

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

export const useFedPolicyMsg = (refreshIndex: number): SWR & { fedPolicyMsg: { msg: string, lastUpdate: number } } => {
  const { data, error } = useCustomSWR(`/api/transparency/fed-policy-msg?${refreshIndex}`, fetcher)

  return {
    fedPolicyMsg: data?.fedPolicyMsg || { msg: 'No guidance at the moment', lastUpdate: null },
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFedIncome = (): SWR & { totalEvents: FedEvent[], totalFedsIncomes: { [key: string]: number } } => {
  const { data, error } = useCacheFirstSWR(`/api/transparency/fed-income?v=2`, fetcher)

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
  const { data, error } = useCacheFirstSWR(`/api/transparency/fed-overview`, fetcher)

  return {
    fedOverviews: data?.fedOverviews || [],    
    isLoading: !error && !data,
    isError: error,
  }
}

export const useStabilizer = (): SWR & { totalEvents: StabilizerEvent[] } => {
  const { data, error } = useCustomSWR(`/api/transparency/stabilizer`, fetcher)

  const totalEvents = data?.totalEvents || [];

  return {
    totalEvents,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFedIncomeChartData = (fedHistoricalEvents: FedEvent[], isAllFedsCase = false): SWR & { chartData: any } => {
  const now = new Date()
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
  chartData.unshift({ x: minX - ONE_DAY_MS, y: 0 });
  chartData.push({ x: now, y: chartData[chartData.length - 1].y });

  return {
    chartData,
  }
}

export const useFedPolicyChartData = (fedHistoricalEvents: FedEvent[], isAllFedsCase = false): SWR & { chartData: any } => {
  const now = new Date()
  const chartData = [...fedHistoricalEvents.sort((a, b) => a.timestamp - b.timestamp).map(event => {
    return {
      x: event.timestamp,
      y: event[isAllFedsCase ? 'newTotalSupply' : 'newSupply'],
    }
  })];

  // add today's timestamp and zero one day before first supply
  const minX = chartData.length > 0 ? Math.min(...chartData.map(d => d.x)) : 1577836800000;
  chartData.unshift({ x: minX - ONE_DAY_MS, y: 0 });
  chartData.push({ x: now, y: chartData[chartData.length - 1].y });

  return {
    chartData,
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