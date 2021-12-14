import { NetworkIds, Proposal, ProposalStatus, SWR, GovEra } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/dist/client/router';

type Proposals = {
  proposals: Proposal[]
}

type SingleProposal = {
  proposal: Proposal
  isLoading?: boolean
}

export const useProposals = (): SWR & Proposals => {
  const router = useRouter()
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/proposals?chainId=${chainId||NetworkIds.mainnet}`, fetcher)
  const dummies = [];

  if(router?.query?.demo === 'gov') {
    const dummy: Proposal = data ? { ...data?.proposals[data?.proposals.length - 1] } : {}
    dummy.proposalNum = 999
    dummy.id = 999
    dummy.title = 'Dummy Proposal'
    dummy.status = ProposalStatus.active
    dummy.era = GovEra.mills
    dummy.againstVotes = 0
    dummy.forVotes = 0
    dummy.executed = false
    dummies.push(dummy)
  }

  return {
    proposals: data?.proposals?.concat(dummies) || [],
    isLoading: !error && !data,
    isError: error,
  }
}
// proposalNum !== id
export const useProposal = (proposalNum: number): SWR & SingleProposal => {
  const { proposals, isLoading } = useProposals()

  if (!proposals || isLoading) {
    return {
      proposal: {} as Proposal,
      isLoading,
    }
  }

  return {
    proposal: proposals?.find(p => p.proposalNum === proposalNum)!,
  }
}
