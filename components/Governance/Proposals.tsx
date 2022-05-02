import { Flex, HStack, Stack, Switch, Text } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { ProposalPreview } from '@app/components/Governance/Proposal'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import { useGovernanceNotifs, useProposals } from '@app/hooks/useProposals'
import { GovEra, Proposal, ProposalStatus } from '@app/types'
import NextLink from 'next/link'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers';
import { DeleteIcon } from '@chakra-ui/icons'
import { clearLocalDrafts } from '@app/util/governance'
import { useEffect, useState } from 'react'
import theme from '@app/variables/theme'
import useStorage from '@app/hooks/useStorage'
import { AnimatedInfoTooltip } from '../common/Tooltip'

export const Proposals = () => {
  const { proposals, isLoading } = useProposals()

  if (isLoading) {
    return (
      <Container
        label="Governance Proposals"
        contentBgColor="gradient3"
        description="Participate in governance of the DAO"
        href="https://docs.inverse.finance/inverse-finance/governance"
      >
        <SkeletonBlob skeletonHeight={16} noOfLines={4} />
      </Container>
    )
  }

  return (
    <Container
      contentBgColor="gradient3"
      label="Governance Proposals"
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/inverse-finance/governance"
    >
      <Stack w="full" spacing={1}>
        {proposals
          .sort((a: Proposal, b: Proposal) => b.proposalNum - a.proposalNum)
          .map((proposal: Proposal) => (
            <ProposalPreview key={proposal.proposalNum} proposal={proposal} />
          ))}
      </Stack>
    </Container>
  )
}

export const PublicDraftProposals = ({ drafts }: { drafts: any[] }) => {
  const { account } = useWeb3React<Web3Provider>()
  const { nbDraftNotif } = useGovernanceNotifs()
  const { value: draftLinkPrefStored, setter: saveDraftLinkPref } = useStorage('draft-link-pref');
  const [prefersEditMode, setPrefersEditMode] = useState(!!draftLinkPrefStored);
  const now = new Date()

  const previews: Partial<Proposal>[] = drafts.map(d => {
    return {
      id: d.publicDraftId,
      title: d.title,
      description: d.description,
      functions: d.functions,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      proposer: account || '',
      era: GovEra.mills,
      startTimestamp: now,
      endTimestamp: (new Date()).setDate(now.getDate() + 3),
      status: ProposalStatus.draft,
    }
  })

  const whitelisted = (process?.env?.NEXT_PUBLIC_DRAFT_WHITELIST || '')?.replace(/\s/g, '').toLowerCase().split(',');
  const canDraft = whitelisted.includes((account || '')?.toLowerCase());

  const handleEditPref = () => {
    const newVal = !prefersEditMode;
    setPrefersEditMode(newVal);
    saveDraftLinkPref(newVal);
  }

  useEffect(() => {
    setPrefersEditMode(draftLinkPrefStored)
  }, [draftLinkPrefStored]);

  return (
    <Container
      label="Draft Proposals"
      contentBgColor="gradient3"
      nbNotif={nbDraftNotif}
      description={
        <Flex fontSize="14px">
          <Text color={theme.colors.secondaryTextColor} fontSize="14px">
            Off-Chain Draft Proposals
          </Text>
          {
            canDraft && <HStack alignItems="center" ml="2">
              <Text color={theme.colors.secondaryTextColor}>
                - Directly use Draft Edit Links?
                <AnimatedInfoTooltip iconProps={{ ml: '2', fontSize: '12px' }} message="Only whitelisted addresses see this option. Your choice will be remembered in your browser's cache." />
              </Text>
              <Switch isChecked={prefersEditMode} onChange={handleEditPref} />
            </HStack>
          }
        </Flex>
      }
    >
      <Stack w="full" spacing={1}>
        {
          previews.map((proposal: Proposal) => <ProposalPreview key={proposal.id} preferseEditLinks={prefersEditMode} isPublicDraft={true} proposal={proposal} />)
        }
      </Stack>
    </Container>
  )
}

export const LocalDraftProposals = ({ drafts }: { drafts: any[] }) => {
  const { account } = useWeb3React<Web3Provider>()
  const [isCleared, setIsCleared] = useState(false)
  const now = new Date()
  const previews: Partial<Proposal>[] = drafts.map(d => {
    return {
      id: d.draftId,
      title: d.title,
      description: d.description,
      functions: d.functions,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
      proposer: account || '',
      era: GovEra.mills,
      startTimestamp: now,
      endTimestamp: (new Date()).setDate(now.getDate() + 3),
      status: ProposalStatus.draft,
    }
  })

  const handleRemoveDrafts = () => {
    clearLocalDrafts()
    setIsCleared(true)
  }

  return (
    <Container
      label="Local Draft Proposals"
      contentBgColor="gradient3"
      description={<HStack alignItems="center" cursor="pointer" onClick={handleRemoveDrafts}>
        <Text fontSize="sm" fontWeight="medium" color="secondaryTextColor">Remove all local drafts</Text>
        <DeleteIcon ml="2" fontSize="10px" color="red.500" />
      </HStack>}
    >
      <Stack w="full" spacing={1}>
        {
          !isCleared ?
            previews.map((proposal: Proposal) => <ProposalPreview key={proposal.id} isLocalDraft={true} proposal={proposal} />)
            : <Flex w="full" justify="center" color="secondaryTextColor" fontSize="sm">
              Drafts have been removed.
            </Flex>
        }
      </Stack>
    </Container>
  )
}

export const ActiveProposals = () => {
  const { proposals } = useProposals()
  const { nbActiveNotif } = useGovernanceNotifs()

  const active = proposals
    ?.filter((proposal: Proposal) => proposal.status === ProposalStatus.active)
    .sort((a: Proposal, b: Proposal) => b.proposalNum - a.proposalNum)

  return (
    <Container
      label="Active Proposals"
      contentBgColor="gradient3"
      nbNotif={nbActiveNotif}
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/inverse-finance/governance"
    >
      <Stack w="full" spacing={1}>
        {active?.length ? (
          active.map((proposal: Proposal) => <ProposalPreview key={proposal.proposalNum} proposal={proposal} />)
        ) : (
          <Flex w="full" justify="center" color="secondaryTextColor" fontSize="sm">
            There are no active proposals.
          </Flex>
        )}
      </Stack>
    </Container>
  )
}

export const RecentProposals = () => {
  const { proposals, isLoading } = useProposals()

  if (isLoading) {
    return (
      <Container label="Recent Proposals" contentBgColor="gradient3">
        <SkeletonBlob skeletonHeight={16} noOfLines={4} />
      </Container>
    )
  }

  const recent = proposals
    ?.filter((proposal: Proposal) => proposal.status !== ProposalStatus.active)
    .sort((a: Proposal, b: Proposal) => b.proposalNum - a.proposalNum)
    .slice(0, 10)

  return (
    <Container label="Recent Proposals" contentBgColor="gradient3">
      <Stack w="full" spacing={1}>
        {recent.map((proposal: Proposal) => (
          <ProposalPreview key={proposal.proposalNum} proposal={proposal} />
        ))}
        <NextLink href="/governance/proposals">
          <Flex
            cursor="pointer"
            w="full"
            p={2}
            justify="center"
            fontSize="xs"
            fontWeight="semibold"
            borderRadius={8}
            textTransform="uppercase"
            color="primary.100"
            _hover={{ bgColor: 'primary.850' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  )
}
