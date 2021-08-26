import { SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type Rates = {
  rates: { [key: string]: number }
}

export const useStakingRates = (): SWR & Rates => {
  const { data, error } = useSWR("/api/staking", fetcher)

  return {
    rates: data?.rates,
    isLoading: !error && !data,
    isError: error,
  }
}
