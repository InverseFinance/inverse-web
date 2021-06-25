import { Delegate, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type Delegates = {
  delegates: Delegate[]
}

export const useDelegates = (): SWR & Delegates => {
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/delegates`, fetcher)

  return {
    delegates: data?.delegates || [],
    isLoading: !error && !data,
    isError: error,
  }
}
