import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/Avatar'
import Container from '@inverse/components/Container'
import { AgainstVotesModal, ForVotesModal } from '@inverse/components/Governance/GovernanceModals'
import { SkeletonList } from '@inverse/components/Skeleton'
import { useProposal, useProposals } from '@inverse/hooks/useProposals'
import { ProposalStatus, ProposalVote } from '@inverse/types'
import { smallAddress } from '@inverse/util'
import { formatUnits } from 'ethers/lib/utils'

const MAX_PREVIEW = 5

type VotesProps = {
  votes: number
  quorumVotes: number
  status: ProposalStatus
  voters: ProposalVote[]
  onViewAll: () => void
}

const Votes = ({ votes, quorumVotes, status, voters, onViewAll }: VotesProps) => (
  <Stack w="full">
    <Flex justify="space-between" p={2}>
      <Text fontSize="sm" fontWeight="medium">{`${voters.length} voters`}</Text>
      <Text fontSize="sm" fontWeight="medium">
        {status === ProposalStatus.active
          ? `${votes.toFixed(0)} / ${quorumVotes.toFixed(0)} votes`
          : `${votes >= 1000 ? `${(votes / 1000).toFixed(2)}k` : votes.toFixed(0)} votes`}
      </Text>
    </Flex>
    {voters.slice(0, MAX_PREVIEW).map(({ voter, votes }: ProposalVote) => (
      <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'purple.900' }}>
        <Stack direction="row" align="center">
          <Avatar address={voter} boxSize={7} />
          <Text fontSize="sm" fontWeight="semibold">
            {smallAddress(voter)}
          </Text>
        </Stack>
        <Text fontSize="sm" fontWeight="semibold">
          {votes >= 1000 ? `${(votes / 1000).toFixed(2)}k` : votes.toFixed(2)}
        </Text>
      </Flex>
    ))}
    {voters.length > MAX_PREVIEW && (
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
        onClick={onViewAll}
        _hover={{ bgColor: 'purple.900' }}
      >
        View All
      </Flex>
    )}
  </Stack>
)

export const ForVotes = ({ id }: { id: number }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { quorumVotes } = useProposals()
  const { proposal, isLoading: proposalIsLoading } = useProposal(id)

  if (proposalIsLoading) {
    return (
      <Container label="For Votes">
        <SkeletonList />
      </Container>
    )
  }

  const { forVotes, status, voters } = proposal

  const forVoters = voters
    .filter(({ support }: ProposalVote) => support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="For Votes">
      <Votes
        votes={forVotes}
        quorumVotes={parseFloat(formatUnits(quorumVotes))}
        voters={forVoters}
        status={status}
        onViewAll={onOpen}
      />
      <ForVotesModal isOpen={isOpen} onClose={onClose} id={id} />
    </Container>
  )
}

export const AgainstVotes = ({ id }: { id: number }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { quorumVotes } = useProposals()
  const { proposal, isLoading: proposalIsLoading } = useProposal(id)

  if (proposalIsLoading) {
    return (
      <Container label="Against Votes">
        <SkeletonList />
      </Container>
    )
  }

  const { againstVotes, status, voters } = proposal

  const againstVoters = voters
    .filter(({ support }: ProposalVote) => !support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="Against Votes">
      <Votes
        votes={againstVotes}
        quorumVotes={parseFloat(formatUnits(quorumVotes))}
        voters={againstVoters}
        status={status}
        onViewAll={onOpen}
      />
      <AgainstVotesModal isOpen={isOpen} onClose={onClose} id={id} />
    </Container>
  )
}
