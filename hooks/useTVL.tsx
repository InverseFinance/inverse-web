import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type TVL = {
  tvl: number
}

export const useTVL = (): SWR & TVL => {
  const { data, error } = useSWR(`${process.env.API_URL}/tvl`, fetcher)

  return {
    tvl: data?.tvl,
    isLoading: !error && !data,
    isError: error,
  }
}
