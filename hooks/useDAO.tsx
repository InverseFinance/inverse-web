import { FedEvent, FedWithData, NetworkIds, SWR, Token } from '@app/types'
import { fetcher } from '@app/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

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
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/transparency/dao?chainId=${chainId||NetworkIds.mainnet}`, fetcher)

  return {
    dolaTotalSupply: data?.dolaTotalSupply || 0,
    invTotalSupply: data?.invTotalSupply || 0,
    dolaOperator: data?.dolaOperator || '',
    treasury: data?.treasury || [],
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

export const useFedHistory = (): SWR & { totalEvents: FedEvent[] } => {
  const { data, error } = useSWR(`/api/transparency/fed-history`, fetcher)

  const totalEvents = data?.totalEvents || [];

  return {
    totalEvents,
    isLoading: !error && !data,
    isError: error,
  }
}
