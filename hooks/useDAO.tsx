import { FedEvent, FedWithData, SWR, Token, StabilizerEvent } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useCustomSWR } from './useCustomSWR';

type DAO = {
  dolaTotalSupply: number
  invTotalSupply: number
  dolaOperator: string
  fantom: {
    dolaTotalSupply: number
    invTotalSupply: number
  }
  treasury: { token: Token, balance: number }[],
  anchorReserves: { token: Token, balance: number }[],
  bonds: { balances: { token: Token, balance: number }[] },
  feds: FedWithData[],
  multisigs: {
    address: string,
    name: string,
    owners: string[],
    funds: { token: Token, balance: number, allowance?: number }[],
    threshold: number,
  }[]
}

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
    feds: data?.feds || [],
    multisigs: data?.multisigs || [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useFedHistory = (): SWR & { totalEvents: FedEvent[], fedPolicyMsg: { msg: string, lastUpdate: number } } => {
  const { data, error } = useCustomSWR(`/api/transparency/fed-policy`, fetcher)

  const totalEvents = data?.totalEvents || [];

  return {
    totalEvents,
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

export const useFedRevenues = (): SWR & { totalEvents: FedEvent[], totalRevenues: { [key:string]: number } } => {
  const { data, error } = useCustomSWR(`/api/transparency/fed-revenues`, fetcher)

  const totalEvents = data?.totalEvents || [];
  const totalRevenues = data?.totalRevenues || {};

  return {
    totalEvents,
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