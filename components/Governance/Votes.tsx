import { Flex, Stack, Text } from '@chakra-ui/react'
import { useProposals } from '@inverse/hooks/useProposals'
import { ProposalStatus, ProposalVote } from '@inverse/types'
import { smallAddress } from '@inverse/util'
import { Avatar } from '../Avatar'
import Container from '../Container'

const Votes = ({
  votes,
  quorumVotes,
  status,
  voters,
}: {
  votes: number
  quorumVotes: number
  status: ProposalStatus
  voters: ProposalVote[]
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
    {voters.slice(0, 5).map(({ voter, votes }: ProposalVote) => (
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
  </Stack>
)

export const ForVotes = ({ id }: { id: number }) => {
  const { proposals, quorumVotes } = useProposals()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  const { voters, forVotes, status } = proposals[id - 1]

  const forVoters = voters
    .filter(({ support }: ProposalVote) => support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container w="sm" label="For Votes">
      <Votes votes={forVotes} quorumVotes={quorumVotes} voters={forVoters} status={status} />
    </Container>
  )
}

export const AgainstVotes = ({ id }: { id: number }) => {
  const { proposals, quorumVotes } = useProposals()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  const { voters, againstVotes, status } = proposals[id - 1]

  const againstVoters = voters
    .filter(({ support }: ProposalVote) => !support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container w="sm" label="Against Votes">
      <Votes votes={againstVotes} quorumVotes={quorumVotes} voters={againstVoters} status={status} />
    </Container>
  )
}
