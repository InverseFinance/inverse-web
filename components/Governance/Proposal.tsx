import { Badge, Flex, HStack, Stack, Text, VStack } from '@chakra-ui/react'
import Container from '@app/components/common/Container'
import { SkeletonBlob, SkeletonTitle } from '@app/components/common/Skeleton'
import { GovEra, Proposal, ProposalFunction, ProposalStatus } from '@app/types'
import moment from 'moment'
import NextLink from 'next/link'
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'

import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { useRouter } from 'next/dist/client/router'
import { ProposalActionPreview } from './ProposalActionPreview'
import { GRACE_PERIOD_MS } from '@app/config/constants'
import { ProposalShareLink } from './ProposalShareLink'
import { InfoMessage } from '@app/components/common/Messages'
import { useGovernanceNotifs } from '@app/hooks/useProposals'
import { Proposer } from './Proposer'
import { ProposalTags } from './ProposalTags'
import { SubmitButton } from '@app/components/common/Button'
import Link from '@app/components/common/Link'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { DWFtextFix } from './dwf-text-fix'

const badgeColors: { [key: string]: string } = {
  [ProposalStatus.active]: 'gray',
  [ProposalStatus.canceled]: 'orange',
  [ProposalStatus.defeated]: 'red',
  [ProposalStatus.succeeded]: 'green',
  [ProposalStatus.pending]: 'gray',
  [ProposalStatus.executed]: 'blue',
  [ProposalStatus.expired]: 'orange',
  [GovEra.alpha]: 'yellow',
  [GovEra.mills]: 'teal',
}

const getDate = (timestamp: moment.MomentInput, addHours = false, isEstimation = false) => {
  return moment(timestamp, 'x').format(
    `${addHours && isEstimation ? '~' : ''}MMM Do${addHours ? ' h:mm a' : ''}, YYYY`
  )
}

const getStatusInfos = (status: ProposalStatus, start: number, end: number, eta: number, isDetails = false, createdAt?: number, updatedAt?: number, endBlock?: number, executionTs?: number) => {
  switch (status) {
    case ProposalStatus.pending:
      return `Will be opened to votes on ${getDate(start, isDetails)}`
    case ProposalStatus.active:
      return `Voting open until block ${endBlock}, ${getDate(end, isDetails, true)}`
    case ProposalStatus.succeeded:
      return `To be queued (will enter a 48h lock period)`
    case ProposalStatus.queued:
      const isLockOver = Date.now() >= eta;
      const text = isLockOver ?
        `Lock period over - Executable until ${getDate(eta + GRACE_PERIOD_MS, isDetails)}`
        : `Locked until ${getDate(eta, isDetails)} (${moment(eta).fromNow()})`
      return text;
    case ProposalStatus.executed:
      return `Created ${getDate(start)} - Executed ${getDate(executionTs || eta)}`
    case ProposalStatus.draft:
      return !createdAt ? '' : `Created ${getDate(createdAt)}${updatedAt ? ` - Last Update ${getDate(updatedAt)}` : ''}`
    default:
      return `Created ${getDate(start)}`
  }
}

export const StatusBadge = ({ status }: { status: ProposalStatus }) => (
  <Badge colorScheme={badgeColors[status]} pl={1} pr={1} fontSize="11px" fontWeight="extrabold">
    <Flex w={16} justify="center">
      {status}
    </Flex>
  </Badge>
)

export const EraBadge = ({ id, era }: { id: number, era: GovEra }) => (
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
  prefersEditLinks = false,
  onTagSelect,
}: {
  proposal: Proposal,
  isLocalDraft?: boolean,
  isPublicDraft?: boolean,
  prefersEditLinks?: boolean,
  onTagSelect?: (tag: { name: string, address: string }) => void,
}) => {
  const { query } = useRouter()
  const { unreadKeys } = useGovernanceNotifs()
  const { themeStyles } = useAppTheme();
  const { title, id, etaTimestamp, endTimestamp, createdAt, updatedAt, startTimestamp, forVotes, againstVotes, status, era, description, functions, proposer, executionTimestamp } = proposal

  const totalVotes = forVotes + againstVotes

  const href = !isLocalDraft ?
    { pathname: `/governance/${isPublicDraft ? 'drafts' + (prefersEditLinks ? '/edit' : '') : 'proposals'}/${era}/${id}`, query }
    : {
      pathname: `/governance/propose`, query: {
        proposalLinkData: JSON.stringify({
          title, description, functions, draftId: id, createdAt, updatedAt
        })
      }
    }

  const isUnread = unreadKeys.includes(isPublicDraft ? `draft-${proposal.id}` : `active-${proposal.proposalNum}`);

  const forumLink = (proposal.description.match(/https:\/\/forum\.inverse\.finance[^\s*)]+/i) || [''])[0];

  return (
    <VStack w='full'>
      <NextLink href={href} legacyBehavior>
        <VStack
          w='full'
          _hover={{ bgColor: 'primary.850' }}
          cursor="pointer"
          borderRadius={8}
          borderTop={`1px solid ${themeStyles.colors.primary['500']}`}
        >
          <Flex
            w="full"
            justify="space-between"
            align="center"
            p={2.5}
            px={2}
          >
            <Flex direction="column">
              <Text fontWeight={isUnread ? 'bold' : 'semibold'} fontSize="lg" color={isUnread ? 'accentTextColor' : 'mainTextColor'}>
                {title}
              </Text>
              <Stack direction={{ base: 'column', sm: 'row' }} align="left">
                <Stack direction="row" align="center">
                  <StatusBadge status={status} />
                  {!isLocalDraft && !isPublicDraft && <EraBadge era={era} id={id} />}
                </Stack>
                <Text textAlign="left" fontSize="13px" color="secondaryTextColor" fontWeight="semibold">
                  {getStatusInfos(proposal.status, startTimestamp, endTimestamp, etaTimestamp, false, createdAt, updatedAt, proposal.endBlock, executionTimestamp)}
                </Text>
              </Stack>
              {
                !!proposer && <HStack mt="2">
                  <Proposer proposer={proposer} />
                </HStack>
              }
            </Flex>
            {(forVotes > 0 || againstVotes > 0) && (
              <Flex direction="column" align="flex-end" display={{ base: 'none', lg: 'flex' }} pl={6}>
                <Stack direction="row" w={56} align="center" justify="flex-end">
                  <Text w={16} fontSize="xs" fontWeight="bold" color={againstVotes > 0 ? 'warning' : 'primary.300'} textAlign="end">
                    {againstVotes >= 1000 ? `${(againstVotes / 1000).toFixed(2)}k` : againstVotes.toFixed(0)}
                  </Text>
                  <Flex w="full">
                    <Flex
                      w={`${Math.floor((againstVotes / (forVotes + againstVotes)) * 100)}%`}
                      h={1}
                      bgColor={againstVotes > 0 ? 'warning' : 'primary.300'}
                    />
                    <Flex w={`${Math.floor((forVotes / (forVotes + againstVotes)) * 100)}%`} h={1} bgColor="success" />
                  </Flex>
                  <Text w={16} fontSize="xs" fontWeight="bold" color="success">
                    {forVotes >= 1000 ? `${(forVotes / 1000).toFixed(2)}k` : forVotes.toFixed(0)}
                  </Text>
                </Stack>
                <Text fontSize="13px" color="lightAccentTextColor" fontWeight="semibold">{`${totalVotes >= 1000 ? `${(totalVotes / 1000).toFixed(2)}k` : totalVotes.toFixed(0)
                  } total votes`}</Text>
              </Flex>
            )}
          </Flex>
          <Flex w='full' px="2" alignItems="center" overflow="auto">
            <ProposalTags functions={proposal.functions} onTagSelect={onTagSelect} />
          </Flex>
        </VStack>
      </NextLink>
      {
        !!forumLink && <Flex w='full' pb="2">
          <Link w='full' href={forumLink} isExternal target="_blank">
            <SubmitButton alignItems="center" w='full'>
              See the forum post <ExternalLinkIcon ml="1" />
            </SubmitButton>
          </Link>
        </Flex>
      }
    </VStack>
  );
}

export const ProposalDetails = ({
  proposal,
  isPublicDraft = false,
  isEditing = false,
}: {
  proposal: Proposal,
  isPublicDraft?: boolean,
  isEditing?: boolean
}) => {
  const { chainId } = useWeb3React<Web3Provider>()
  const { query } = useRouter()

  if (!proposal?.id) {
    return (
      <Container contentBgColor="gradient3" label={<SkeletonTitle />}>
        <SkeletonBlob />
      </Container>
    )
  }

  const { title, description, proposer, status, createdAt, updatedAt, startTimestamp, etaTimestamp, endTimestamp, id, era, functions, executionTimestamp, proposalNum } = proposal
  const _description = proposalNum === 113 ? DWFtextFix : description;

  return (
    <Container
      label={title}
      contentBgColor="gradient2"
      px={isEditing ? '0' : undefined}
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
                description={_description}
                functions={functions}
              />
            }
          </Stack>
          <Text textAlign="left" fontSize="sm">
            {getStatusInfos(proposal.status, startTimestamp, endTimestamp, etaTimestamp, true, createdAt, updatedAt, proposal.endBlock, executionTimestamp)}
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
            !!proposer && <Proposer proposer={proposer} />
          }
        </Flex>
        <Flex w="full" overflow="auto" color="mainTextColor">
          <ReactMarkdown className="markdown-body" remarkPlugins={era !== GovEra.alpha ? [gfm] : undefined}>
            {
              era === GovEra.alpha ? _description.replace(
                /(?:(?:https?|ftp):\/\/)?[\w/\-?=%.]+\.[\w/\-&?=%.]+/,
                (m: string) => `[(Link)](${m})`
              ) : _description
            }
          </ReactMarkdown>
        </Flex>
      </Stack>
    </Container>
  )
}

export const ProposalActions = ({ proposal, isEditing = false }: { proposal: Proposal, isEditing?: boolean }) => {
  if (!proposal?.id) {
    return <></>
  }

  const { functions } = proposal

  return (
    <Container contentBgColor="gradient2" label="Actions" px={isEditing ? '0' : '6'}>
      <Stack w="full" spacing={6} p={2}>
        {!functions.length && <InfoMessage description="At least one on-chain action is required to submit the proposal" alertProps={{ w: 'full' }} />}
        {functions.map(({ target, signature, callData, value }: ProposalFunction, i: number) => {
          return <ProposalActionPreview key={i} num={i + 1} target={target} signature={signature} callData={callData} value={value} />
        })}
      </Stack>
    </Container>
  )
}
