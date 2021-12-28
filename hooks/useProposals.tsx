import { DraftProposal, NetworkIds, Proposal, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getLocalDrafts } from '@inverse/util/governance';

type Proposals = {
  proposals: Proposal[]
}

type SingleProposal = {
  proposal: Proposal
  isLoading?: boolean
}
export const useDraftProposals = (): SWR & { drafts: DraftProposal[] } => {
  const { data, error } = useSWR(`get-local-drafts`, async () => {
    return {
      drafts: await getLocalDrafts() || []
    }
  })

  return {
    drafts: data?.drafts || [],
    isLoading: !error && !data,
    isError: error,
  }
}
export const useProposals = (): SWR & Proposals => {
  // const router = useRouter()
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/proposals?chainId=${chainId||NetworkIds.mainnet}`, fetcher)

  return {
    proposals: data?.proposals || [],
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
