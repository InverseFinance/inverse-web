import { Proposal, ProposalVote } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'

export const useProposals = () => {
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/proposals`, fetcher)

  return {
    quorumVotes: data?.quorumVotes,
    proposals: data?.proposals,
    isLoading: !error && !data,
    isError: error,
  }
}
