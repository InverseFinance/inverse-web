import { NetworkIds, SWR } from '@inverse/types'
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
  treasury: {
    dolaBalance: number  
    invBalance: number  
    daiBalance: number  
  }
  fedSupplies: {
    address: string
    name: string
    supply: number
  }[]
}

export const useDAO = (): SWR & DAO => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/dao?chainId=${chainId||NetworkIds.mainnet}`, fetcher)

  return {
    dolaTotalSupply: data?.dolaTotalSupply || 0,
    invTotalSupply: data?.invTotalSupply || 0,
    treasury: {
      dolaBalance: data?.treasury?.dolaBalance || 0,
      invBalance: data?.treasury?.invBalance || 0,
      daiBalance: data?.treasury?.daiBalance || 0,
    },
    fantom: {
      dolaTotalSupply: data?.fantom?.dolaTotalSupply || 0,
      invTotalSupply: data?.fantom?.invTotalSupply || 0,
    },
    fedSupplies: data?.fedSupplies || [],
    isLoading: !error && !data,
    isError: error,
  }
}
