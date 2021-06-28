import { Delegate, Proposal, ProposalVote, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'
import { useProposals } from './useProposals'

type Delegates = {
  delegates: Delegate[]
}

export const useDelegates = (): SWR & Delegates => {
  const { proposals } = useProposals()
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/delegates`, fetcher)

  if (!proposals || !data) {
    return {
      delegates: [],
      isLoading: !error,
      isError: error,
    }
  }

  return {
    delegates: data.delegates.map((delegate: Delegate) => ({
      ...delegate,
      votes: proposals.filter(({ voters }: Proposal) =>
        voters?.find(({ voter }: ProposalVote) => voter === delegate.address)
      ),
    })),
    isLoading: !error,
    isError: error,
  }
}
