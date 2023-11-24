import { Flex, Stack, Text, useDisclosure } from '@chakra-ui/react'
import { Avatar } from '@app/components/common/Avatar'
import Container from '@app/components/common/Container'
import { AgainstVotesModal, ForVotesModal } from '@app/components/Governance/GovernanceModals'
import { SkeletonList } from '@app/components/common/Skeleton'
import { ProposalStatus, ProposalVote, Proposal } from '@app/types'
import NextLink from 'next/link'
import { shortenNumber } from '@app/util/markets'
import { useNamedAddress } from '@app/hooks/useNamedAddress'
import { getHistoricalGovParams } from '@app/util/governance'

const MAX_PREVIEW = 5

type VotesProps = {
  votes: number
  status: ProposalStatus
  voters: ProposalVote[]
  onViewAll: () => void
  quorum?: number
}

export const Voter = ({ voter, votes }: { voter: string, votes: number }) => {
  const { addressName } = useNamedAddress(voter);
  return (
    <NextLink
      key={voter}
      href={`/governance/delegates/${voter}`}
      passHref
      legacyBehavior>
      <Flex cursor="pointer" justify="space-between" p={2} borderRadius={8} _hover={{ bgColor: 'primary.850' }}>
        <Stack direction="row" align="center">
          <Avatar address={voter} sizePx={28} />
          <Text fontSize="sm" fontWeight="semibold">
            {addressName}
          </Text>
        </Stack>
        <Text fontSize="sm" fontWeight="semibold">
          {shortenNumber(votes, 2)}
        </Text>
      </Flex>
    </NextLink>
  );
}

const Votes = ({ votes, status, voters, onViewAll, quorum }: VotesProps) => {
  return (
    <Stack w="full">
      <Flex justify="space-between" p={2}>
        <Text fontSize="sm" fontWeight="medium">{`${voters.length} voters`}</Text>
        <Text fontSize="sm" fontWeight="medium">
          {status === ProposalStatus.active
            ? `${votes.toFixed(0)}${quorum ? ` / ${quorum}` : ''} votes`
            : `${shortenNumber(votes, 2)} votes`}
        </Text>
      </Flex>
      {voters.slice(0, MAX_PREVIEW).map(({ voter, votes }: ProposalVote) => (
        <Voter key={voter} voter={voter} votes={votes} />
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
          color="lightAccentTextColor"
          onClick={onViewAll}
          _hover={{ bgColor: 'primary.850' }}
        >
          View All
        </Flex>
      )}
    </Stack>
  )
}

export const ForVotes = ({ proposal }: { proposal: Proposal }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!proposal?.id) {
    return (
      <Container label="For Votes" contentBgColor="gradient3">
        <SkeletonList />
      </Container>
    )
  }

  const { forVotes, status, voters, startBlock } = proposal

  const { quorum } = getHistoricalGovParams(startBlock);

  const forVoters = voters
    .filter(({ support }: ProposalVote) => support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="For Votes">
      <Votes votes={forVotes} voters={forVoters} status={status} onViewAll={onOpen} quorum={quorum} />
      <ForVotesModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Container>
  )
}

export const AgainstVotes = ({ proposal }: { proposal: Proposal }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  if (!proposal?.id) {
    return (
      <Container label="Against Votes">
        <SkeletonList />
      </Container>
    )
  }

  const { againstVotes, status, voters, startBlock } = proposal;

  const againstVoters = voters
    .filter(({ support }: ProposalVote) => !support)
    .sort((a: ProposalVote, b: ProposalVote) => b.votes - a.votes)

  return (
    <Container label="Against Votes">
      <Votes votes={againstVotes} voters={againstVoters} status={status} onViewAll={onOpen} />
      <AgainstVotesModal isOpen={isOpen} onClose={onClose} proposal={proposal} />
    </Container>
  )
}
