import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { useProposals } from '@inverse/hooks/useProposals'
import { ProposalStatus, ProposalVote } from '@inverse/types'
import { smallAddress } from '@inverse/util'
import { Avatar } from '../Avatar'
import Container from '../Container'
import { AgainstVotesModal, ForVotesModal } from './GovernanceModals'

const MAX_PREVIEW = 5

const Votes = ({
  votes,
  quorumVotes,
  status,
  voters,
  onViewAll,
}: {
  votes: number
  quorumVotes: number
  status: ProposalStatus
  voters: ProposalVote[]
  onViewAll: any
}) => (
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

export const ForVotes = ({ id }: any) => {
  const { proposals, quorumVotes } = useProposals()
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  const { voters, forVotes, status } = proposals[id - 1]

  const forVoters = voters
    .filter(({ support }: ProposalVote) => support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="For Votes">
      <Votes votes={forVotes} quorumVotes={quorumVotes} voters={forVoters} status={status} onViewAll={onOpen} />
      <ForVotesModal isOpen={isOpen} onClose={onClose} id={id} />
    </Container>
  )
}

export const AgainstVotes = ({ id }: any) => {
  const { proposals, quorumVotes } = useProposals()
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  const { voters, againstVotes, status } = proposals[id - 1]

  const againstVoters = voters
    .filter(({ support }: ProposalVote) => !support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="Against Votes">
      <Votes votes={againstVotes} quorumVotes={quorumVotes} voters={againstVoters} status={status} onViewAll={onOpen} />
      <AgainstVotesModal isOpen={isOpen} onClose={onClose} id={id} />
    </Container>
  )
}
