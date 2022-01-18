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
import gfm from 'remark-gfm'

import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/dist/client/router'
import { ProposalActionPreview } from './ProposalActionPreview'
import { GRACE_PERIOD_MS } from '@inverse/config/constants'
import { ProposalShareLink } from './ProposalShareLink'
import { InfoMessage } from '@inverse/components/common/Messages'
import { useGovernanceNotifs } from '@inverse/hooks/useProposals'

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

const getDate = (timestamp: moment.MomentInput, addHours = false) => {
  return moment(timestamp, 'x').format(
    `MMM Do${addHours ? ' h:mm a' : ''}, YYYY`
  )
}

const getStatusInfos = (status: ProposalStatus, start: number, end: number, eta: number, isDetails = false, createdAt?: number, updatedAt?: number) => {
  switch (status) {
    case ProposalStatus.pending:
      return `Will be opened to votes on ${getDate(start, isDetails)}`
    case ProposalStatus.active:
      return `Voting open until ${getDate(end, isDetails)}`
    case ProposalStatus.succeeded:
      return `To be queued (will enter a 48h lock period)`
    case ProposalStatus.queued:
      const isLockOver = Date.now() >= eta;
      const text = isLockOver ?
        `Lock period over - Executable until ${getDate(eta + GRACE_PERIOD_MS, isDetails)}`
        : `Locked until ${getDate(eta, isDetails)} (${moment(eta).fromNow()})`
      return text;
    case ProposalStatus.executed:
      return getDate(eta)
    case ProposalStatus.draft:
      return !createdAt ? '' : `Created ${getDate(createdAt)}${updatedAt ? ` - Last Update ${getDate(updatedAt)}` : ''}`
    default:
      return getDate(eta || end || start)
  }
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

export const ProposalPreview = ({
  proposal,
  isLocalDraft = false,
  isPublicDraft = false,
}: {
  proposal: Proposal,
  isLocalDraft?: boolean,
  isPublicDraft?: boolean,
}) => {
  const { query } = useRouter()
  const { unreadKeys } = useGovernanceNotifs()
  const { title, id, etaTimestamp, endTimestamp, createdAt, updatedAt, startTimestamp, forVotes, againstVotes, status, era, description, functions } = proposal

  const totalVotes = forVotes + againstVotes
  const href = !isLocalDraft ?
    { pathname: `/governance/${isPublicDraft ? 'drafts' : 'proposals'}/${era}/${id}`, query }
    : {
      pathname: `/governance/propose`, query: {
        proposalLinkData: JSON.stringify({
          title, description, functions, draftId: id, createdAt, updatedAt
        })
      }
    }

  const isUnread = unreadKeys.includes(isPublicDraft ? `draft-${proposal.id}` : `active-${proposal.proposalNum}`);

  return (
    <NextLink href={href}>
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
          <Text fontWeight={isUnread ? 'bold' : 'semibold'} fontSize="lg" color={isUnread ? 'secondary' : 'white'}>
            {title}
          </Text>
          <Stack direction={{ base: 'column', sm: 'row' }} align="left">
            <Stack direction="row" align="center">
              <StatusBadge status={status} />
              {!isLocalDraft && !isPublicDraft && <EraBadge era={era} id={id} />}
            </Stack>
            <Text textAlign="left" fontSize="13px" color="purple.100" fontWeight="semibold">
              {getStatusInfos(proposal.status, startTimestamp, endTimestamp, etaTimestamp, false, createdAt, updatedAt)}
            </Text>
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

export const ProposalDetails = ({ proposal, isPublicDraft = false }: { proposal: Proposal, isPublicDraft?: boolean }) => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()

  if (!proposal?.id) {
    return (
      <Container label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const { title, description, proposer, status, createdAt, updatedAt, startTimestamp, etaTimestamp, endTimestamp, id, era, functions } = proposal

  return (
    <Container
      label={title}
      description={
        <Stack direction={{ base: 'column', sm: 'row' }} justify="left" align="left" alignItems={{ base: 'flex-start', sm: 'center' }} spacing={1}>
          <Stack direction="row" align="left" alignItems="center">
            <StatusBadge status={status} />
            <EraBadge era={era} id={id} />
            {
              (proposal.status !== ProposalStatus.draft || isPublicDraft)
              && <ProposalShareLink
                draftId={isPublicDraft ? proposal.id : undefined}
                isPublicDraft={isPublicDraft}
                type="copy"
                title={title}
                description={description}
                functions={functions}
              />
            }
          </Stack>
          <Text textAlign="left" fontSize="sm">
            {getStatusInfos(proposal.status, startTimestamp, endTimestamp, etaTimestamp, true, createdAt, updatedAt)}
          </Text>
        </Stack>
      }
    >
      <Stack w="full" pl={3} pr={3}>
        <Flex w="full" justify="space-between" align="center">
          <Text fontSize="md" fontWeight="semibold">
            Details
          </Text>
          {
            !!proposer && <Stack direction="row" align="center">
              <Avatar address={proposer} sizePx={20} />
              <Link fontSize="sm" href={`https://etherscan.io/address/${proposer}`}>
                {namedAddress(proposer, chainId)}
              </Link>
            </Stack>
          }
        </Flex>
        <Flex w="full" overflow="auto">
          <ReactMarkdown className="markdown-body" remarkPlugins={era !== GovEra.alpha ? [gfm] : undefined}>
            {
              era === GovEra.alpha ? description.replace(
                /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-&?=%.]+/,
                (m: string) => `[(Link)](${m})`
              ) : description
            }
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
        {!functions.length && <InfoMessage description="At least one on-chain action is required to submit the proposal" alertProps={{ w: 'full' }} />}
        {functions.map(({ target, signature, callData }: ProposalFunction, i: number) => {
          return <ProposalActionPreview key={i} num={i + 1} target={target} signature={signature} callData={callData} />
        })}
      </Stack>
    </Container>
  )
}
