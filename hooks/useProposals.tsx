import { Proposal, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import { BigNumber } from 'ethers'
import useSWR from 'swr'

type Proposals = {
  quorumVotes: BigNumber
  proposals: Proposal[]
}

type SingleProposal = {
  proposal: Proposal
}

export const useProposals = (): SWR & Proposals => {
  const { data, error } = useSWR(`${process.env.API_URL}/inverse/proposals`, fetcher)

  return {
    quorumVotes: data?.quorumVotes,
    proposals: data?.proposals,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useProposal = (id: number): SWR & SingleProposal => {
  const { proposals, isLoading, isError } = useProposals()

  return {
    proposal: proposals?.find((proposal: Proposal) => id === proposal.id) || ({} as Proposal),
    isLoading,
    isError,
  }
}
