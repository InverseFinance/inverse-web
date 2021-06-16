import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

export const useMarkets = () => {
  const { data, error } = useSWR(`${process.env.API_URL}/anchor/markets`, fetcher)

  return {
    markets: data?.markets,
    isLoading: !error && !data,
    isError: error,
  }
}
