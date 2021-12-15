import { Badge, Flex, Stack, Text } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/common/Avatar'
import Container from '@inverse/components/common/Container'
import Link from '@inverse/components/common/Link'
import { SkeletonBlob, SkeletonTitle } from '@inverse/components/common/Skeleton'
import { GovEra, Proposal, ProposalFunction, ProposalStatus } from '@inverse/types'
import { namedAddress } from '@inverse/util'
import moment from 'moment'
import NextLink from 'next/link'
import ReactMarkdown from 'react-markdown'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/dist/client/router'
import { ProposalActionPreview } from './ProposalActionPreview'

const badgeColors: { [key: string]: string } = {
  [ProposalStatus.active]: 'gray',
  [ProposalStatus.canceled]: 'black',
  [ProposalStatus.defeated]: 'red',
  [ProposalStatus.succeeded]: 'green',
  [ProposalStatus.pending]: 'gray',
  [ProposalStatus.executed]: 'blue',
  [ProposalStatus.expired]: 'orange',
  [GovEra.alpha]: 'yellow',
  [GovEra.mills]: 'teal',
}

const StatusBadge = ({ status }: { status: ProposalStatus }) => (
  <Badge colorScheme={badgeColors[status]} pl={1} pr={1} fontSize="11px" fontWeight="extrabold">
    <Flex w={16} justify="center">
      {status}
    </Flex>
  </Badge>
)

const EraBadge = ({ id, era }: { id: number, era: GovEra }) => (
  <Badge colorScheme={badgeColors[era]} pl={1} pr={1} w="fit-content" fontSize="11px" fontWeight="extrabold">
    <Flex justify="center">
      {`#${id.toString().padStart(3, '0')} - ${era} ERA`}
    </Flex>
  </Badge>
)

export const ProposalPreview = ({ proposal }: { proposal: Proposal }) => {
  const { query } = useRouter()
  const { title, id, etaTimestamp, endTimestamp, startTimestamp, forVotes, againstVotes, status, era } = proposal

  const totalVotes = forVotes + againstVotes

  return (
    <NextLink href={{ pathname: `/governance/proposals/${era}/${id}`, query }}>
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
            <StatusBadge status={status} />
            <EraBadge era={era} id={id} />
            <Text fontSize="13px" color="purple.100" fontWeight="semibold">
              {`${moment(etaTimestamp || endTimestamp || startTimestamp, 'x').format(
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
            <Text fontSize="13px" color="purple.100" fontWeight="semibold">{`${totalVotes >= 1000 ? `${(totalVotes / 1000).toFixed(2)}k` : totalVotes.toFixed(0)
              } votes`}</Text>
          </Flex>
        )}
      </Flex>
    </NextLink>
  )
}

export const ProposalDetails = ({ proposal }: { proposal: Proposal }) => {
  const { chainId } = useWeb3React<Web3Provider>()

  if (!proposal?.id) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const { title, description, proposer, status, startTimestamp, id, era } = proposal

  return (
    <Container
      label={title}
      description={
        <Stack direction="row" align="center" spacing={1}>
          <StatusBadge status={status} />
          <EraBadge era={era} id={id} />
          <Text fontSize="sm">
            {` - ${moment(startTimestamp, 'x').format(
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

export const ProposalActions = ({ proposal }: { proposal: Proposal }) => {
  if (!proposal?.id) {
    return <></>
  }

  const { functions } = proposal

  return (
    <Container label="Actions">
      <Stack w="full" spacing={6} p={2}>
        {functions.map(({ target, signature, callData }: ProposalFunction, i: number) => {
          return <ProposalActionPreview key={i} num={i+1} target={target} signature={signature} callData={callData} />
        })}
      </Stack>
    </Container>
  )
}
