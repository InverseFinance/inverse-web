import { SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCustomSWR } from './useCustomSWR';

type DOLA = {
  totalSupply: number
}

export const useDOLA = (): SWR & DOLA => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useCustomSWR(`/api/dola?chainId=${chainId||process.env.NEXT_PUBLIC_CHAIN_ID!}`, fetcher)

  return {
    totalSupply: data?.totalSupply || 0,
    isLoading: !error && !data,
    isError: error,
  }
}