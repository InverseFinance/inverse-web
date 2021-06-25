import { ProposalVote, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

type Voters = {
  voters: ProposalVote[]
}

export const useVoters = (id: number): SWR & Voters => {
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/proposals/${id}`, fetcher)

  return {
    voters: data?.voters || [],
    isLoading: !error && !data,
    isError: error,
  }
}
