import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type TVL = {
  tvl: number
}

export const useTVL = (): SWR & TVL => {
  const { data, error } = useSWR("/api/tvl", fetcher)

  return {
    tvl: data?.tvl,
    isLoading: !error && !data,
    isError: error,
  }
}
