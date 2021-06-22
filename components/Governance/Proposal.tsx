import { Badge, Flex, Stack, Text } from '@chakra-ui/react'
import { useProposals } from '@inverse/hooks/useProposals'
import Container from '../Container'
import { Proposal, ProposalFunction, ProposalStatus } from '@inverse/types'
import moment from 'moment'
import NextLink from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Avatar } from '../Avatar'
import Link from '../Link'
import { smallAddress } from '@inverse/util'
import { CONTRACTS } from '@inverse/config'
import { AbiCoder, FunctionFragment, isAddress } from 'ethers/lib/utils'

const badgeColors: any = {
  [ProposalStatus.active]: 'gray',
  [ProposalStatus.canceled]: 'black',
  [ProposalStatus.defeated]: 'red',
  [ProposalStatus.succeeded]: 'green',
  [ProposalStatus.pending]: 'gray',
  [ProposalStatus.executed]: 'blue',
  [ProposalStatus.expired]: 'orange',
}

export const ProposalPreview = ({ proposal }: { proposal: Proposal }) => {
  const { title, id, etaTimestamp, endTimestamp, forVotes, againstVotes, status, voters } = proposal

  const totalVotes = forVotes + againstVotes

  return (
    <NextLink href={`/governance/proposals/${id}`}>
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
    </NextLink>
  )
}

export const ProposalDetails = ({ id }: { id: number }) => {
  const { proposals } = useProposals()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  const { title, description, proposer, status, startTimestamp } = proposals[id - 1]

  return (
    <Container
      w="4xl"
      label={title}
      description={
        <Stack direction="row" align="center" spacing={1}>
          <Badge colorScheme={badgeColors[status]} pl={1} pr={1} fontSize="11px" fontWeight="extrabold">
            <Flex w={16} justify="center">
              {status}
            </Flex>
          </Badge>
          <Text fontSize="sm">{`Proposal #${id.toString().padStart(3, '0')}`}</Text>
          <Text>-</Text>
          <Text>{moment(startTimestamp, 'x').format('MMM Do, YYYY')}</Text>
        </Stack>
      }
    >
      <Stack w="full" pl={3} pr={3}>
        <Flex w="full" justify="space-between" align="center">
          <Text fontSize="md" fontWeight="semibold">
            Details
          </Text>
          <Stack direction="row" align="center">
            <Avatar address={proposer} boxSize={5} />
            <Link fontSize="sm" href={`https://etherscan.io/address/${proposer}`}>
              {smallAddress(proposer)}
            </Link>
          </Stack>
        </Flex>
        <Flex w="full">
          <ReactMarkdown className="markdown-body">
            {description.replace(/(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-&?=%.]+/, '[(Link)]($1)')}
          </ReactMarkdown>
        </Flex>
      </Stack>
    </Container>
  )
}

export const ProposalActions = ({ id }: { id: number }) => {
  const { proposals } = useProposals()

  if (!proposals || !proposals[id - 1]) {
    return <></>
  }

  const { functions } = proposals[id - 1]

  return (
    <Container w="4xl" label="Actions">
      <Stack
        w="full"
        spacing={0}
        direction={{ base: 'column', md: 'row' }}
        wrap="wrap"
        shouldWrapChildren
        overflowX="auto"
      >
        {functions.map(({ target, signature, callData }: ProposalFunction, i: number) => {
          const callDatas = new AbiCoder()
            .decode(FunctionFragment.from(signature).inputs, callData)
            .toString()
            .split(',')

          const sigTypes = signature.match(/\(([^)]+)\)/)
          const types = sigTypes ? sigTypes[1].split(',') : []

          return (
            <Stack w={{ base: 56, md: 'sm' }} m={2} spacing={1}>
              <Flex
                overflowX="auto"
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                color="purple.200"
              >{`Action ${i + 1}`}</Flex>
              <Flex direction={{ base: 'column', sm: 'row' }}>
                <Link href={`https://etherscan.io/address/${target}`} fontSize="15px" fontWeight="semibold">
                  {CONTRACTS[target] || smallAddress(target)}
                </Link>
                <Flex w="full" fontSize="sm" fontWeight="medium" wrap="wrap">{`.${signature}`}</Flex>
              </Flex>
              <Flex w="full" direction="column">
                {callDatas.map((data: any, i: number) => (
                  <Stack w="full" direction="row" align="center">
                    <Text fontSize="xs" textTransform="uppercase" color="purple.200">
                      {types[i]}
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      {isAddress(data) ? (
                        <Link href={`https://etherscan.io/address/${data}`}>{smallAddress(data)}</Link>
                      ) : (
                        <Text>{data}</Text>
                      )}
                    </Text>
                  </Stack>
                ))}
              </Flex>
            </Stack>
          )
        })}
      </Stack>
    </Container>
  )
}
