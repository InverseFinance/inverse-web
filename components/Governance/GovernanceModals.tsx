import { Flex, Stack, Text } from '@chakra-ui/react'
import { useProposals } from '@inverse/hooks/useProposals'
import { ProposalVote } from '@inverse/types'
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

  const { voters } = proposals[id - 1]

  const votes = voters
    .filter(({ support }: ProposalVote) => (voteType === VoteType.for ? support : !support))
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      header={
        <Stack minWidth={24} direction="row" align="center">
          <Text>{`${voteType} Votes`}</Text>
        </Stack>
      }
    >
      <Stack m={2}>
        {votes.map(({ voter, votes }: ProposalVote) => (
          <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'purple.900' }}>
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
