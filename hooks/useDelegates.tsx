import { Delegate, ProposalVote } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'
import { useProposals } from './useProposals'

export const useDelegates = () => {
  const { proposals } = useProposals()
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/delegates`, fetcher)

  if (!data || !proposals) {
    return {
      isLoading: !error && !data,
      isError: error,
    }
  }

  const delegates = data.delegates.map((delegate: Delegate) => ({
    ...delegate,
    votes: proposals.reduce((prev: any, curr: any) => {
      const vote = curr.voters.find((vote: ProposalVote) => vote.voter === delegate.address)
      if (vote) {
        prev.push(vote)
      }
      return prev
    }, []),
  }))

  return {
    delegates,
    isLoading: !error && !data,
    isError: error,
  }
}
