import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

export const useVoters = (id: number) => {
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/proposals/${id}`, fetcher)

  return {
    voters: data?.voters,
    isLoading: !error && !data,
    isError: error,
  }
}
