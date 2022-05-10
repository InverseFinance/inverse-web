import { FedEvent, SWR, StabilizerEvent, DAO } from '@app/types'
import { getNetworkConfigConstants } from '@app/util/networks';
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR';

const oneDay = 86400000;

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
  const { data, error } = useCustomSWR(`/api/transparency/dao`, fetcher)

  return {
    dolaTotalSupply: data?.dolaTotalSupply || 0,
    invTotalSupply: data?.invTotalSupply || 0,
    dolaOperator: data?.dolaOperator || '',
    treasury: data?.treasury || [],
    bonds: data?.bonds || { balances: [] },
    anchorReserves: data?.anchorReserves || [],
    fantom: {
      dolaTotalSupply: data?.fantom?.dolaTotalSupply || 0,
      invTotalSupply: data?.fantom?.invTotalSupply || 0,
    },
    feds: data?.feds || defaultFedsData,
    multisigs: data?.multisigs || [],
    pols: data?.pols || [],
    isLoading: !error && !data,
    isError: error,
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

export const useFedHistory = (): SWR & { totalEvents: FedEvent[], fedPolicyMsg: { msg: string, lastUpdate: number } } => {
  const { data, error } = useCustomSWR(`/api/transparency/fed-policy`, fetcher)

  const totalEvents = data?.totalEvents || [];

  return {
    totalEvents: addFedInfosToEvent(totalEvents, data?.feds || []),
    fedPolicyMsg: data?.fedPolicyMsg || { msg: 'No guidance at the moment', lastUpdate: null },
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

export const useFedRevenues = (): SWR & { totalEvents: FedEvent[], totalRevenues: { [key: string]: number } } => {
  const { data, error } = useCustomSWR(`/api/transparency/fed-revenues`, fetcher)

  const totalEvents = data?.totalEvents || [];
  const totalRevenues = data?.totalRevenues || {};

  return {
    totalEvents: addFedInfosToEvent(totalEvents, data?.feds || []),
    totalRevenues,
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

export const useFedRevenuesChartData = (fedHistoricalEvents: FedEvent[], isAllFedsCase = false): SWR & { chartData: any } => {
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
  chartData.unshift({ x: minX - oneDay, y: 0 });
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
  chartData.unshift({ x: minX - oneDay, y: 0 });
  chartData.push({ x: now, y: chartData[chartData.length - 1].y });

  return {
    chartData,
  }
}

export const useEligibleRefunds = (): SWR & { transactions: any[] } => {
  const { data, error } = useCustomSWR(`/api/gov/eligible-refunds`, fetcher)

  return {
    transactions: data?.transactions || [],
    isLoading: !data && !error,
    isError: !!error,
  }
}