import { DraftProposal, NetworkIds, Proposal, PublicDraftProposal, SWR } from '@inverse/types'
import { fetcher } from '@inverse/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getLocalDrafts, getReadGovernanceNotifs } from '@inverse/util/governance';

type Proposals = {
  proposals: Proposal[]
}

type SingleProposal = {
  proposal: Proposal
  isLoading?: boolean
}
export const useLocalDraftProposals = (): SWR & { drafts: DraftProposal[] } => {
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

export const usePublicDraftProposals = (): SWR & { drafts: PublicDraftProposal[] } => {
  const { data, error } = useSWR(`/api/drafts`, fetcher)

  return {
    drafts: data?.drafts || [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useGovernanceNotifs = (): SWR & {
  draftKeys: string[],
  activeProposalKeys: string[],
  keys: string[],
  nbNotif: number,
} => {
  const { data, error } = useSWR(`/api/governance-notifs`, fetcher)
  const { data: readData, error: readError } = useSWR(`read-governance-notifs`, async () => {
    return {
      keys: await getReadGovernanceNotifs() || []
    }
  })

  let nbNotif = data && readData ? data.keys.filter((key: string) => !readData.keys.includes(key)).length : 0;

  return {
    draftKeys: data?.draftKeys || [],
    activeProposalKeys: data?.activeProposalKeys || [],
    keys: data?.keys || [],
    nbNotif,
    isLoading: !error && !data,
    isError: error,
  }
}

export const useProposals = (): SWR & Proposals => {
  // const router = useRouter()
  const { chainId } = useWeb3React<Web3Provider>()

  const { data, error } = useSWR(`/api/proposals?chainId=${chainId || NetworkIds.mainnet}`, fetcher)

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
