import { SWR, Plan } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'


type Plans = {
    plans: Plan[]
}

export const useGuardPlans = (): SWR & Plans => {
  const { data, error } = useSWR("/api/guard", fetcher)
  return {
    plans: data?.plans,
    isLoading: !error && !data,
    isError: error,
  }
}