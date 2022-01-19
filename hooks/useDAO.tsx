import { NetworkIds, SWR, Token } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

type DAO = {
  dolaTotalSupply: number
  invTotalSupply: number
  fantom: {
    dolaTotalSupply: number
    invTotalSupply: number
  }
  treasury: { token: Token, balance: number }[],
  anchorReserves: { token: Token, balance: number }[],
  fedSupplies: {
    address: string
    name: string
    supply: number
  }[],
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
    treasury: data?.treasury || [],
    anchorReserves: data?.anchorReserves || [],
    fantom: {
      dolaTotalSupply: data?.fantom?.dolaTotalSupply || 0,
      invTotalSupply: data?.fantom?.invTotalSupply || 0,
    },
    fedSupplies: data?.fedSupplies || [],
    multisigs: data?.multisigs || [],
    isLoading: !error && !data,
    isError: error,
  }
}
