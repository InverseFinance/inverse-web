import { Badge, Flex, Stack, Text } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/common/Avatar'
import Container from '@inverse/components/common/Container'
import Link from '@inverse/components/common/Link'
import { SkeletonBlob, SkeletonTitle } from '@inverse/components/common/Skeleton'
import { useProposal } from '@inverse/hooks/useProposals'
import { Proposal, ProposalFunction, ProposalStatus } from '@inverse/types'
import { namedAddress } from '@inverse/util'
import { AbiCoder, FunctionFragment, isAddress } from 'ethers/lib/utils'
import moment from 'moment'
import NextLink from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useWeb3React } from '@web3-react/core';
import { getNetworkConfigConstants } from '@inverse/config/networks'
import { Web3Provider } from '@ethersproject/providers';

const badgeColors: { [key: string]: string } = {
  [ProposalStatus.active]: 'gray',
  [ProposalStatus.canceled]: 'black',
  [ProposalStatus.defeated]: 'red',
  [ProposalStatus.succeeded]: 'green',
  [ProposalStatus.pending]: 'gray',
  [ProposalStatus.executed]: 'blue',
  [ProposalStatus.expired]: 'orange',
}

export const ProposalPreview = ({ proposal }: { proposal: Proposal }) => {
  const { title, id, etaTimestamp, endTimestamp, startTimestamp, forVotes, againstVotes, status } = proposal

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
        _hover={{ bgColor: 'purple.850' }}
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
              .padStart(3, '0')} - ${moment(etaTimestamp || endTimestamp || startTimestamp, 'x').format(
              'MMM Do, YYYY'
            )}`}</Text>
          </Stack>
        </Flex>
        {(forVotes > 0 || againstVotes > 0) && (
          <Flex direction="column" align="flex-end" display={{ base: 'none', lg: 'flex' }} pl={6}>
            <Stack direction="row" w={56} align="center" justify="flex-end">
              <Text w={16} fontSize="xs" fontWeight="bold" color="purple.300" textAlign="end">
                {againstVotes >= 1000 ? `${(againstVotes / 1000).toFixed(2)}k` : againstVotes.toFixed(0)}
              </Text>
              <Flex w="full">
                <Flex
                  w={`${Math.floor((againstVotes / (forVotes + againstVotes)) * 100)}%`}
                  h={1}
                  bgColor="purple.300"
                />
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
        )}
      </Flex>
    </NextLink>
  )
}

export const ProposalDetails = ({ id }: { id: number }) => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { proposal, isLoading } = useProposal(id)

  if (isLoading) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
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
              {namedAddress(proposer, chainId)}
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
  const { chainId } = useWeb3React<Web3Provider>()
  const { CONTRACTS } = getNetworkConfigConstants(chainId)
  const { proposal, isLoading } = useProposal(id)

  if (isLoading) {
    return <></>
  }

  const { functions } = proposal

  return (
    <Container label="Actions">
      <Stack w="full" spacing={6} p={2}>
        {functions.map(({ target, signature, callData }: ProposalFunction, i: number) => {
          const callDatas = new AbiCoder()
            .decode(FunctionFragment.from(signature).inputs, callData)
            .toString()
            .split(',')

          return (
            <Stack w="full" key={i} spacing={1}>
              <Flex fontSize="xs" fontWeight="bold" textTransform="uppercase" color="purple.200">{`Action ${
                i + 1
              }`}</Flex>
              <Flex w="full" overflowX="auto" direction="column" bgColor="purple.850" borderRadius={8} p={3}>
                <Flex fontSize="15px">
                  <Link href={`https://etherscan.io/address/${target}`} color="purple.200" fontWeight="semibold">
                    {CONTRACTS[target] || target}
                  </Link>
                  <Flex>{`.${signature.split('(')[0]}(${!callDatas[0] ? ')' : ''}`}</Flex>
                </Flex>
                <Flex direction="column" fontSize="sm" pl={4} pr={4}>
                  {callDatas.map((data: string, i) =>
                    isAddress(data) ? (
                      <Link key={i} href={`https://etherscan.io/address/${data}`} whiteSpace="nowrap">
                        {CONTRACTS[data] || data}
                        {i + 1 !== callDatas.length ? ',' : ''}
                      </Link>
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
          )
        })}
      </Stack>
    </Container>
  )
}
