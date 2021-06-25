import { COMPTROLLER } from '@inverse/config'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { Market } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import { useWeb3React } from '@web3-react/core'
import useSWR from 'swr'

export const useMarkets = () => {
  const { data, error } = useSWR(`${process.env.API_URL}/anchor/markets`, fetcher)

  return {
    markets: data?.markets,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAccountMarkets = () => {
  const { account } = useWeb3React()
  const { markets } = useMarkets()
  const { data, error } = useEtherSWR([COMPTROLLER, 'getAssetsIn', account])

  if (!data || !markets) {
    return {
      markets: [],
      isLoading: !error,
      isError: error,
    }
  }

  return {
    markets: data.map((address: string) => markets.find(({ token }: Market) => token === address)),
    isLoading: !error && !data,
    isError: error,
  }
}
