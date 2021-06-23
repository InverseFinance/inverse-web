import { Flex, Stack, Text } from '@chakra-ui/react'
import { useDelegates } from '@inverse/hooks/useDelegates'
import { useProposals } from '@inverse/hooks/useProposals'
import { Delegate, ProposalVote } from '@inverse/types'
import { smallAddress } from '@inverse/util'
import { commify } from 'ethers/lib/utils'
import { Avatar } from '../Avatar'
import { Modal } from '../Modal'

enum VoteType {
  for = 'For',
  against = 'Against',
}

export const VoteCountModal = ({ isOpen, onClose, id, voteType }: any) => {
  const { proposals } = useProposals()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  const { voters, forVotes, againstVotes } = proposals[id - 1]

  const votes = voters
    .filter(({ support }: ProposalVote) => (voteType === VoteType.for ? support : !support))
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  const totalVotes = voteType === VoteType.for ? forVotes : againstVotes

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>{`${voteType} Votes: ${commify(totalVotes.toFixed(2))}`}</Text>
        </Stack>
      }
    >
      <Stack m={3} height={400} overflowY="auto">
        {votes.map(({ voter, votes }: ProposalVote) => (
          <Flex
            cursor="pointer"
            justify="space-between"
            p={2}
            borderRadius={8}
            _hover={{ bgColor: 'purple.900' }}
            key={voter}
          >
            <Stack direction="row" align="center">
              <Avatar address={voter} boxSize={7} />
              <Text fontSize="sm" fontWeight="semibold">
                {smallAddress(voter)}
              </Text>
            </Stack>
            <Text fontSize="sm" fontWeight="semibold">
              {commify(votes.toFixed(2))}
            </Text>
          </Flex>
        ))}
      </Stack>
    </Modal>
  )
}

export const ForVotesModal = ({ isOpen, onClose, id }: any) => {
  return <VoteCountModal isOpen={isOpen} onClose={onClose} id={id} voteType={VoteType.for} />
}

export const AgainstVotesModal = ({ isOpen, onClose, id }: any) => {
  return <VoteCountModal isOpen={isOpen} onClose={onClose} id={id} voteType={VoteType.against} />
}

export const DelegatesModal = ({ isOpen, onClose }: any) => {
  const { delegates } = useDelegates()

  if (!delegates) {
    return <></>
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>Delegates</Text>
        </Stack>
      }
    >
      <Stack m={3} height={400} overflowY="auto">
        {delegates.map(({ address, balance, delegators, votes }: Delegate) => (
          <Flex
            cursor="pointer"
            justify="space-between"
            p={2}
            borderRadius={8}
            _hover={{ bgColor: 'purple.900' }}
            key={address}
          >
            <Stack direction="row" align="center">
              <Avatar address={address} boxSize={7} />
              <Flex direction="column">
                <Text fontSize="sm" fontWeight="semibold">
                  {smallAddress(address)}
                </Text>
                <Text fontSize="sm" color="purple.100">
                  {`${votes.length} votes`}
                </Text>
              </Flex>
            </Stack>
            <Flex direction="column" align="flex-end">
              <Text fontSize="sm" fontWeight="semibold">
                {balance.toFixed(2)}
              </Text>
              <Text fontSize="sm" color="purple.100">
                {`${delegators.length} delegators`}
              </Text>
            </Flex>
          </Flex>
        ))}
      </Stack>
    </Modal>
  )
}
