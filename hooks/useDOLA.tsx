import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type DOLA = {
  totalSupply: number
}

export const useDOLA = (): SWR & DOLA => {
  const { data, error } = useSWR('/api/dola', fetcher)

  return {
    totalSupply: data?.totalSupply || 0,
    isLoading: !error && !data,
    isError: error,
  }
}
