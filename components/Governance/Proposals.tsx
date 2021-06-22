import { Badge, Flex, Stack, Text } from '@chakra-ui/react'
import { useProposals } from '@inverse/hooks/useProposals'
import Container from '../Container'
import { Proposal, ProposalStatus } from '@inverse/types'
import moment from 'moment'

const badgeColors: any = {
  [ProposalStatus.active]: 'gray',
  [ProposalStatus.canceled]: 'black',
  [ProposalStatus.defeated]: 'red',
  [ProposalStatus.succeeded]: 'green',
  [ProposalStatus.pending]: 'gray',
  [ProposalStatus.executed]: 'blue',
  [ProposalStatus.expired]: 'orange',
}

const ProposalPreview = ({ proposal }: { proposal: Proposal }) => {
  const { title, id, etaTimestamp, endTimestamp, forVotes, againstVotes, status, voters } = proposal

  const totalVotes = forVotes + againstVotes

  return (
    <Flex
      w="full"
      justify="space-between"
      align="center"
      cursor="pointer"
      p={2.5}
      pl={4}
      pr={4}
      borderRadius={8}
      _hover={{ bgColor: 'purple.900' }}
    >
      <Flex w="lg" direction="column">
        <Text w="full" fontWeight="semibold" fontSize="lg" isTruncated>
          {title}
        </Text>
        <Stack direction="row" align="center">
          <Badge colorScheme={badgeColors[status]} pl={1} pr={1} fontSize="11px" fontWeight="extrabold">
            <Flex w={16} justify="center">
              {status}
            </Flex>
          </Badge>
          )
          <Text fontSize="13px" color="purple.100" fontWeight="semibold">{`#${id
            .toString()
            .padStart(3, '0')} - ${moment(etaTimestamp || endTimestamp, 'x').format('MMM Do, YYYY')}`}</Text>
        </Stack>
      </Flex>
      <Flex direction="column" align="flex-end">
        <Stack direction="row" w={56} align="center" justify="flex-end">
          <Text w={16} fontSize="xs" fontWeight="bold" color="purple.300" textAlign="end">
            {againstVotes >= 1000 ? `${(againstVotes / 1000).toFixed(2)}k` : againstVotes.toFixed(0)}
          </Text>
          <Flex w="full">
            <Flex w={`${Math.floor((againstVotes / (forVotes + againstVotes)) * 100)}%`} h={1} bgColor="purple.300" />
            <Flex w={`${Math.floor((forVotes / (forVotes + againstVotes)) * 100)}%`} h={1} bgColor="success" />
          </Flex>
          <Text w={16} fontSize="xs" fontWeight="bold" color="success">
            {forVotes >= 1000 ? `${(forVotes / 1000).toFixed(2)}k` : forVotes.toFixed(0)}
          </Text>
        </Stack>
        <Text fontSize="13px" color="purple.100" fontWeight="semibold">{`${voters?.length || 0} voters - ${
          totalVotes >= 1000 ? `${(totalVotes / 1000).toFixed(2)}k` : totalVotes.toFixed(0)
        } votes`}</Text>
      </Flex>
    </Flex>
  )
}

export const Proposals = () => {
  const { proposals } = useProposals()

  return proposals ? (
    <Container
      w="60rem"
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
