import { NetworkIds, SWR, TokenWithBalance } from '@app/types'
import { fetcher } from '@app/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

type TVL = {
  tvl: number
  data: { tvl: number, anchor: { tvl: number, assets: TokenWithBalance[] } }
}

export const useTVL = (): SWR & TVL => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/tvl?chainId=${chainId||process.env.NEXT_PUBLIC_CHAIN_ID!}`, fetcher)

  return {
    tvl: data?.tvl,
    data: data || {},
    isLoading: !error && !data,
    isError: error,
  }
}
