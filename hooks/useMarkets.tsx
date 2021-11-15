import { getNetworkConfigConstants } from '@inverse/config/networks'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { Market, NetworkIds, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import { useWeb3React } from '@web3-react/core'
import useSWR from 'swr'
import { Web3Provider } from '@ethersproject/providers';

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
  const { COMPTROLLER } = getNetworkConfigConstants(chainId)

  const { markets } = useMarkets()
  const { data, error } = useEtherSWR([COMPTROLLER, 'getAssetsIn', account])

  return {
    markets:
      data && markets?.length ? data.map((address: string) => markets.find(({ token }) => token === address)) : [],
    isLoading: !error && !data,
    isError: error,
  }
}
