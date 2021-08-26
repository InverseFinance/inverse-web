import { Delegate, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type Delegates = {
  delegates?: { [key: string]: Delegate }
}

type TopDelegates = {
  delegates: Delegate[]
}

export const useDelegates = (): SWR & Delegates => {
  const { data, error } = useSWR("/api/delegates", fetcher)

  return {
    delegates: data?.delegates,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useTopDelegates = (): SWR & TopDelegates => {
  const { delegates, isLoading } = useDelegates()

  if (!delegates || isLoading) {
    return {
      delegates: [],
      isLoading,
    }
  }

  return {
    delegates: Object.values(delegates)
      .filter(({ votingPower }) => votingPower)
      .sort((a, b) => b.votingPower - a.votingPower),
  }
}
