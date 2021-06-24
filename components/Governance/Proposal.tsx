import { Badge, Flex, Stack, Text } from '@chakra-ui/react'
import { useProposal, useProposals } from '@inverse/hooks/useProposals'
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
  const { title, id, etaTimestamp, endTimestamp, forVotes, againstVotes, status } = proposal

  const totalVotes = forVotes + againstVotes

  return (
    <NextLink href={`/governance/proposals/${id}`}>
      <Flex
        w="full"
        justify="space-between"
        align="center"
        cursor="pointer"
        p={2.5}
        pl={2}
        pr={2}
        borderRadius={8}
        _hover={{ bgColor: 'purple.900' }}
      >
        <Flex direction="column" overflowX="auto">
          <Text fontWeight="semibold" fontSize="lg">
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
        <Flex direction="column" align="flex-end" display={{ base: 'none', lg: 'flex' }} pl={6}>
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
          <Text fontSize="13px" color="purple.100" fontWeight="semibold">{`${
            totalVotes >= 1000 ? `${(totalVotes / 1000).toFixed(2)}k` : totalVotes.toFixed(0)
          } votes`}</Text>
        </Flex>
      </Flex>
    </NextLink>
  )
}

export const ProposalDetails = ({ id }: { id: number }) => {
  const { proposal } = useProposal(id)

  if (!proposal) {
    return <></>
  }

  const { title, description, proposer, status, startTimestamp } = proposal

  return (
    <Container
      label={title}
      description={
        <Stack direction="row" align="center" spacing={1}>
          <Badge colorScheme={badgeColors[status]} pl={1} pr={1} fontSize="11px" fontWeight="extrabold">
            <Flex w={16} justify="center">
              {status}
            </Flex>
          </Badge>
          <Text fontSize="sm">{`#${id.toString().padStart(3, '0')} - ${moment(startTimestamp, 'x').format(
            'MMM Do, YYYY'
          )}`}</Text>
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
            {description.replace(
              /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-&?=%.]+/,
              (m: string) => `[(Link)](${m})`
            )}
          </ReactMarkdown>
        </Flex>
      </Stack>
    </Container>
  )
}

export const ProposalActions = ({ id }: { id: number }) => {
  const { proposal } = useProposal(id)

  if (!proposal) {
    return <></>
  }

  const { functions } = proposal

  return (
    <Container label="Actions">
      <Stack w="full" overflowX="auto" spacing={0} direction="column" wrap="wrap" shouldWrapChildren>
        {functions.map(({ target, signature, callData }: ProposalFunction, i: number) => {
          const callDatas = new AbiCoder()
            .decode(FunctionFragment.from(signature).inputs, callData)
            .toString()
            .split(',')

          return (
            <Stack w={56} m={2} key={i}>
              <Stack spacing={1} w="full">
                <Flex fontSize="xs" fontWeight="semibold" textTransform="uppercase" color="purple.200">{`Action ${
                  i + 1
                }`}</Flex>
                <Flex direction="column">
                  <Flex w="full" fontSize="15px">
                    <Link href={`https://etherscan.io/address/${target}`} color="purple.100" fontWeight="semibold">
                      {CONTRACTS[target] || target}
                    </Link>
                    <Flex fontWeight="medium">{`.${signature.split('(')[0]}(${!callDatas[0] ? ')' : ''}`}</Flex>
                  </Flex>
                  <Flex w="full" direction="column" fontSize="sm" fontWeight="medium" paddingLeft={4}>
                    {callDatas.map((data: string, i) =>
                      isAddress(data) ? (
                        <Flex>
                          <Link key={i} href={`https://etherscan.io/address/${data}`}>
                            {CONTRACTS[data] || data}
                            {i + 1 !== callDatas.length ? ',' : ''}
                          </Link>
                        </Flex>
                      ) : (
                        <Text key={i}>
                          {data}
                          {i + 1 !== callDatas.length ? ',' : ''}
                        </Text>
                      )
                    )}
                  </Flex>
                  {callDatas[0] && <Text>)</Text>}
                </Flex>
              </Stack>
            </Stack>
          )
        })}
      </Stack>
    </Container>
  )
}
