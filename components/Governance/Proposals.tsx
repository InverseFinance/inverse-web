import { Flex, HStack, Stack, Text } from '@chakra-ui/react'
import Container from '@inverse/components/common/Container'
import { ProposalPreview } from '@inverse/components/Governance/Proposal'
import { SkeletonBlob } from '@inverse/components/common/Skeleton'
import { useGovernanceNotifs, useProposals } from '@inverse/hooks/useProposals'
import { GovEra, Proposal, ProposalStatus } from '@inverse/types'
import NextLink from 'next/link'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers';
import { DeleteIcon } from '@chakra-ui/icons'
import { clearLocalDrafts } from '@inverse/util/governance'
import { useState } from 'react'

export const Proposals = () => {
  const { proposals, isLoading } = useProposals()

  if (isLoading) {
    return (
      <Container
        label="Governance Proposals"
        description="Participate in governance of the DAO"
        href="https://docs.inverse.finance/governance"
      >
        <SkeletonBlob skeletonHeight={16} noOfLines={4} />
      </Container>
    )
  }

  return (
    <Container
      label="Governance Proposals"
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/governance"
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

  return (
    <Container
      label="Draft Proposals"
      nbNotif={nbDraftNotif}
      description="Off-Chain Draft Proposals"
    >
      <Stack w="full" spacing={1}>
        {
          previews.map((proposal: Proposal) => <ProposalPreview key={proposal.id} isPublicDraft={true} proposal={proposal} />)
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
      description={<HStack alignItems="center" cursor="pointer" onClick={handleRemoveDrafts}>
        <Text fontSize="sm" fontWeight="medium" color="purple.200">Remove all local drafts</Text>
        <DeleteIcon ml="2" fontSize="10px" color="red.500" />
      </HStack>}
    >
      <Stack w="full" spacing={1}>
        {
          !isCleared ?
            previews.map((proposal: Proposal) => <ProposalPreview key={proposal.id} isLocalDraft={true} proposal={proposal} />)
            : <Flex w="full" justify="center" color="purple.200" fontSize="sm">
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
      nbNotif={nbActiveNotif}
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/governance"
    >
      <Stack w="full" spacing={1}>
        {active?.length ? (
          active.map((proposal: Proposal) => <ProposalPreview key={proposal.proposalNum} proposal={proposal} />)
        ) : (
          <Flex w="full" justify="center" color="purple.200" fontSize="sm">
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
      <Container label="Recent Proposals">
        <SkeletonBlob skeletonHeight={16} noOfLines={4} />
      </Container>
    )
  }

  const recent = proposals
    ?.filter((proposal: Proposal) => proposal.status !== ProposalStatus.active)
    .sort((a: Proposal, b: Proposal) => b.proposalNum - a.proposalNum)
    .slice(0, 10)

  return (
    <Container label="Recent Proposals">
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
            color="purple.100"
            _hover={{ bgColor: 'purple.850' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  )
}
