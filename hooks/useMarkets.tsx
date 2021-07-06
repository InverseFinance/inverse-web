import { COMPTROLLER, TOKENS, UNDERLYING } from '@inverse/config'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { Market, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import { useWeb3React } from '@web3-react/core'
import useSWR from 'swr'

type Markets = {
  markets: Market[]
}

export const useMarkets = (): SWR & Markets => {
  const { data, error } = useSWR(`${process.env.API_URL}/markets`, fetcher)

  return {
    markets: data?.markets,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useAccountMarkets = (): SWR & Markets => {
  const { account } = useWeb3React()
  const { markets } = useMarkets()
  const { data, error } = useEtherSWR([COMPTROLLER, 'getAssetsIn', account])

  return {
    markets:
      data && markets?.length ? data.map((address: string) => markets.find(({ token }) => token === address)) : [],
    isLoading: !error && !data,
    isError: error,
  }
}
