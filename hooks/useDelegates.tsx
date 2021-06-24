import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

export const useDelegates = () => {
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/delegates`, fetcher)

  return {
    delegates: data?.delegates,
    isLoading: !error && !data,
    isError: error,
  }
}
