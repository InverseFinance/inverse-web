import { FedEvent, SWR, StabilizerEvent, DAO } from '@app/types'
import { getNetworkConfigConstants } from '@app/util/networks';
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR';


const { FEDS } = getNetworkConfigConstants();

const defaultFedsData = FEDS.map(((fed) => {
  return {
      ...fed,
      events: [],
      supply: 0,
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
    totalEvents: addFedInfosToEvent(totalEvents, data?.feds||[]),
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
    totalEvents: addFedInfosToEvent(totalEvents, data?.feds||[]),
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