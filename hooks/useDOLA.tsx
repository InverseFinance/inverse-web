import { NetworkIds, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

type DOLA = {
  totalSupply: number
  ftmTotalSupply: number
  fedSupplies: {
    address: string
    name: string
    supply: number
  }[]
}

export const useDOLA = (): SWR & DOLA => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/dola?chainId=${chainId||NetworkIds.mainnet}`, fetcher)

  return {
    totalSupply: data?.totalSupply || 0,
    ftmTotalSupply: data?.ftmTotalSupply || 0,
    fedSupplies: data?.fedSupplies || [],
    isLoading: !error && !data,
    isError: error,
  }
}
