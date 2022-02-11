import { SWR, TokenWithBalance } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useCustomSWR } from './useCustomSWR';

type TVL = {
  tvl: number
  data: { tvl: number, anchor: { tvl: number, assets: TokenWithBalance[] } }
}

export const useTVL = (): SWR & TVL => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useCustomSWR(`/api/tvl?chainId=${chainId||process.env.NEXT_PUBLIC_CHAIN_ID!}`, fetcher)

  return {
    tvl: data?.tvl,
    data: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}
