import { Flex, Stack } from '@chakra-ui/react'
import { useProposals } from '@inverse/hooks/useProposals'
import Container from '../Container'
import { Proposal, ProposalStatus } from '@inverse/types'
import NextLink from 'next/link'
import { ProposalPreview } from './Proposal'

export const Proposals = () => {
  const { proposals } = useProposals()

  return proposals ? (
    <Container
      w="4xl"
      label="Governance Proposals"
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/governance"
    >
      <Stack w="full" spacing={1}>
        {proposals
          .sort((a: Proposal, b: Proposal) => b.id - a.id)
          .map((proposal: Proposal) => (
            <ProposalPreview key={proposal.id} proposal={proposal} />
          ))}
      </Stack>
    </Container>
  ) : (
    <></>
  )
}

export const ActiveProposals = () => {
  const { proposals } = useProposals()

  const active = proposals
    ?.filter((proposal: Proposal) => proposal.status === ProposalStatus.active)
    .sort((a: Proposal, b: Proposal) => b.id - a.id)

  return proposals ? (
    <Container
      w="4xl"
      label="Active Proposals"
      description="Participate in governance of the DAO"
      href="https://docs.inverse.finance/governance"
    >
      <Stack w="full" spacing={1}>
        {active?.length ? (
          active.map((proposal: Proposal) => <ProposalPreview key={proposal.id} proposal={proposal} />)
        ) : (
          <Flex w="full" justify="center" color="purple.200" fontSize="sm">
            There are no active proposals.
          </Flex>
        )}
      </Stack>
    </Container>
  ) : (
    <></>
  )
}

export const RecentProposals = () => {
  const { proposals } = useProposals()

  const recent = proposals
    ?.filter((proposal: Proposal) => proposal.status !== ProposalStatus.active)
    .sort((a: Proposal, b: Proposal) => b.id - a.id)
    .slice(0, 7)

  return proposals ? (
    <Container w="4xl" label="Recent Proposals">
      <Stack w="full" spacing={1}>
        {recent.map((proposal: Proposal) => (
          <ProposalPreview key={proposal.id} proposal={proposal} />
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
            _hover={{ bgColor: 'purple.900' }}
          >
            View All
          </Flex>
        </NextLink>
      </Stack>
    </Container>
  ) : (
    <></>
  )
}
