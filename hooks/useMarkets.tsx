import { getNetworkConfigConstants } from '@app/util/networks'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { Market, NetworkIds, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import { useWeb3React } from '@web3-react/core'
import useSWR from 'swr'
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/dist/client/router'

type Markets = {
  markets: Market[]
}

export const useMarkets = (): SWR & Markets => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/markets?chainId=${chainId||NetworkIds.mainnet}`, fetcher)

  return {
    markets: data?.markets || [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAccountMarkets = (): SWR & Markets => {
  const { account, chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()
  const userAddress = (query?.viewAddress as string) || account;
  const { COMPTROLLER } = getNetworkConfigConstants(chainId)

  const { markets } = useMarkets()
  const { data, error } = useEtherSWR([COMPTROLLER, 'getAssetsIn', userAddress])

  return {
    markets:
      data && markets?.length ? data.map((address: string) => markets.find(({ token }) => token === address)) : [],
    isLoading: !error && !data,
    isError: error,
  }
}
