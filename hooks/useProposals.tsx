import { DraftProposal, DraftReview, GovEra, NetworkIds, Proposal, PublicDraftProposal, SWR } from '@app/types'
import { fetcher } from '@app/util/web3'
import useSWR from 'swr'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { getLastNbNotif, getLocalDrafts, getReadGovernanceNotifs, setLastNbNotif } from '@app/util/governance';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useCustomSWR } from './useCustomSWR';

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

export const usePublicDraftProposals = (archived = false): SWR & { drafts: PublicDraftProposal[] } => {
  const { data, error } = useCustomSWR(`/api/drafts`, fetcher)

  return {
    drafts: (data?.drafts || []).filter(d => archived === (!!d.isArchived)),
    isLoading: !error && !data,
    isError: error,
  }
}

export const useProofOfReviews = (id: number, isDraft: boolean, era?: GovEra): SWR & { reviews: DraftReview[] } => {
  const { data, error } = useCustomSWR(`/api/drafts/reviews/${id}?isProposal=${!isDraft}&era=${era||''}`, id ? fetcher : () => new Promise(r => r(undefined)))

  return {
    reviews: data?.reviews || [],
    isLoading: !error && !data,
    isError: error,
  }
}

export const useGovernanceNotifs = (): SWR & {
  draftKeys: string[],
  activeProposalsKeys: string[],
  keys: string[],
  unreadKeys: string[],
  nbNotif: number,
  nbActiveNotif: number,
  nbDraftNotif: number,
} => {
  const { pathname } = useRouter()

  const { data, error } = useCustomSWR(`/api/governance-notifs`, fetcher)

  const { data: lastNbNotif } = useSWR(`last-nb-notifs${pathname}`, async () => {
    return await getLastNbNotif()
  })

  const { data: readData } = useSWR(`read-governance-notifs${pathname}`, async () => {
    return new Promise((resolve) => {
      setTimeout(async() => {
        resolve({ keys: await getReadGovernanceNotifs() || [] })
      }, 1000);
    });
  })

  const unreadKeys = data && readData ? data.keys.filter((key: string) => !readData.keys.includes(key)) : [];
  const nbNotif = data && readData ? unreadKeys.length : lastNbNotif;
  const nbDraftNotif = data && readData ? data.draftKeys.filter((key: string) => !readData.keys.includes(key)).length : 0;
  const nbActiveNotif = data && readData ? data.activeProposalsKeys.filter((key: string) => !readData.keys.includes(key)).length : 0;

  useEffect(() => {
    if(nbNotif === lastNbNotif) { return }
    setLastNbNotif(nbNotif);
  }, [data, readData, nbNotif]);

  return {
    draftKeys: data?.draftKeys || [],
    activeProposalsKeys: data?.activeProposalsKeys || [],
    keys: data?.keys || [],
    unreadKeys,
    nbNotif,
    nbActiveNotif,
    nbDraftNotif,
    isLoading: !error && !data,
    isError: error,
  }
}
export const useProposalsBreakdown = (): SWR & { active: number, passed: number, failed: number } => {
  let uri = `/api/proposals?v=2&isStatsOnly=true`;
  const { data, error } = useCustomSWR(uri, fetcher)

  return {
    active: data?.active || 0,
    failed: data?.failed || 0,
    passed: data?.passed || 0,
    isLoading: !error && !data,
    isError: error,
  }
}
export const useProposals = (filters?: { proposalNum?: number, size?: number, isStatsOnly?: boolean }): SWR & Proposals => {
  let uri = `/api/proposals?v=2`;
  const { proposalNum, size } = filters || {};
  if(!!proposalNum) {
    uri += `&proposalNum=${proposalNum}`;
  }
  if(!!size) {
    uri += `&size=${size}`;
  }
  if(!!filters?.isStatsOnly) {
    uri += `&isStatsOnly=${filters.isStatsOnly}`;
  }  
  const { data, error } = useCustomSWR(uri, fetcher)

  return {
    proposals: data?.proposals || [],
    isLoading: !error && !data,
    isError: error,
  }
}
// proposalNum !== id
export const useProposal = (proposalNum: number): SWR & SingleProposal => {
  const { proposals, isLoading } = useProposals({ proposalNum })

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
