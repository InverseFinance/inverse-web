import { Flex, HStack, Stack, Switch, Text, useMediaQuery } from '@chakra-ui/react'
import { Avatar } from '@app/components/common/Avatar'
import { Breadcrumbs } from '@app/components/common/Breadcrumbs'
import Container from '@app/components/common/Container'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { SkeletonBlob } from '@app/components/common/Skeleton'
import Table from '@app/components/common/Table'
import { useTopDelegates } from '@app/hooks/useDelegates'
import { Delegate, Proposal, ProposalStatus } from '@app/types'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import Head from 'next/head'
import { useNamedAddress } from '@app/hooks/useNamedAddress'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { useProposals } from '@app/hooks/useProposals'
import useEtherSWR from '@app/hooks/useEtherSWR'
import { getGovernanceAddress } from '@app/util/contracts';
import { EraBadge, StatusBadge } from '@app/components/Governance'
import { useState } from 'react'
import { useContractEvents } from '@app/hooks/useContractEvents'
import { INV_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import ScannerLink from '@app/components/common/ScannerLink'
import { BlockTimestamp } from '@app/components/common/BlockTimestamp'
import { BURN_ADDRESS } from '@app/config/constants'

const { INV } = getNetworkConfigConstants();

type Supporter = { address: string, inv: number, xinv: number, delegatedPower: number }
type DelegateVote = Proposal & { hasVoted: boolean, hasVotedFor: boolean, hasVotedWith: number }
type DelegateEventItem = { blockNumber: number, txHash: string, delegator: string, fromDelegate: string, toDelegate: string }

const DelegateName = ({ delegate, delegator }: { delegate: string, delegator: string }) => {
  const { addressName } = useNamedAddress(delegate);
  const label = delegate === BURN_ADDRESS ? 'Nobody' : delegate === delegator ? 'Self' : addressName
  return <ScannerLink value={delegate} label={label} />;
}

export const DelegatingEventsTable = ({
  delegator = undefined,
  fromDelegate = undefined,
  toDelegate = undefined,
}: {
  delegator?: string,
  fromDelegate?: string,
  toDelegate?: string,
}) => {
  const { events } = useContractEvents(INV, INV_ABI, 'DelegateChanged', [delegator, fromDelegate, toDelegate]);

  const items = events.map(e => {
    return {
      blockNumber: e.blockNumber,
      txHash: e.transactionHash,
      delegator: e.args.delegator,
      fromDelegate: e.args.fromDelegate,
      toDelegate: e.args.toDelegate,
    }
  });

  items.sort((a, b) => b.blockNumber - a.blockNumber);

  const columns = [
    {
      field: 'txHash',
      label: 'TX',
      header: ({ ...props }) => <Flex justify="flex-start" minWidth={'120px'} {...props} />,
      value: ({ txHash }: DelegateEventItem) => <Flex justify="flex-start" minWidth={'120px'}>
        <ScannerLink value={txHash} />
      </Flex>,
    },
    {
      field: 'blockNumber',
      label: 'Date',
      header: ({ ...props }) => <Flex justify="flex-start" maxW={'120px'} minW={'120px'} {...props} />,
      value: ({ blockNumber }: DelegateEventItem) => <Flex justify="flex-start" maxW={'120px'} minW={'120px'}>
        <BlockTimestamp blockNumber={blockNumber} />
      </Flex>,
    },
    {
      field: 'fromDelegate',
      label: 'Old Delegate',
      header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
      value: ({ fromDelegate, delegator }: DelegateEventItem) => <Flex justify="center" minWidth={'120px'}>
        <DelegateName delegate={fromDelegate} delegator={delegator} />
      </Flex>,
    },
    {
      field: 'toDelegate',
      label: 'New Delegate',
      header: ({ ...props }) => <Flex justify="center" minWidth={'120px'} {...props} />,
      value: ({ toDelegate, delegator }: DelegateEventItem) => <Flex justify="center" minWidth={'120px'}>
        <DelegateName delegate={toDelegate} delegator={delegator} />
      </Flex>,
    },
  ];

  return (
    <Container
      label="Delegation Changes"
      contentProps={{ maxW: '90vw', overflowX: 'auto' }}
      collapsable={true}
    >
      <Table
        columns={columns}
        items={items}
        keyName={'txHash'}
        defaultSort="blockNumber"
        defaultSortDir="desc"
      // onClick={({ toDelegate }: DelegateVote) => router.push(`/governance/delegates/${toDelegate}`)}
      />
    </Container>
  )
}

export const PastVotesTable = ({ delegate }: { delegate: Partial<Delegate> }) => {
  const router = useRouter();
  const { proposals } = useProposals();

  const { data } = useEtherSWR([
    ...proposals.map(p => {
      return [getGovernanceAddress(p.era), 'getReceipt', p.id, delegate.address];
    })
  ]);

  proposals.sort((a, b) => b.proposalNum - a.proposalNum)

  const proposalsWithVotes = proposals.map((p, i) => {
    return {
      ...p,
      hasVoted: data && data[i] && data[i][0],
      hasVotedFor: data && data[i] && data[i][0] && data[i][1],
      hasVotedWith: data && data[i] && data[i][2] && getBnToNumber(data[i][2]),
    }
  });

  const columns = [
    {
      field: 'proposalNum',
      label: 'Proposal',
      header: ({ ...props }) => <Flex justify="flex-start" minWidth={'120px'} {...props} />,
      value: ({ id, era }: DelegateVote) => <Flex justify="flex-start" minWidth={'120px'}>
        <EraBadge id={id} era={era} />
      </Flex>,
    },
    {
      field: 'title',
      label: 'Title',
      header: ({ ...props }) => <Flex justify="flex-start" maxW={'200px'} minW={'200px'} {...props} />,
      value: ({ title }: DelegateVote) => <Flex justify="flex-start" maxW={'200px'} minW={'200px'}>
        <Text maxW={'200px'} minW={'200px'} textAlign="left" fontSize="12px">{title}</Text>
      </Flex>,
    },
    {
      field: 'hasVoted',
      label: 'Voted?',
      header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
      value: ({ hasVoted, status }: DelegateVote) => <Flex color={hasVoted ? 'secondary' : 'warning'} justify="center" minWidth={'80px'}>
        {status === ProposalStatus.active ? hasVoted ? 'Voted' : 'Not Yet' : hasVoted ? 'Voted' : 'Abstained'}
      </Flex>,
    },
    {
      field: 'hasVotedFor',
      label: 'Decision',
      header: ({ ...props }) => <Flex justify="center" minWidth={'70px'} {...props} />,
      value: ({ hasVoted, hasVotedFor }: DelegateVote) => <Flex fontWeight="extrabold" color={hasVoted ? hasVotedFor ? 'secondary' : 'info' : 'white'} justify="center" minWidth={'70px'}>
        {hasVoted ? hasVotedFor ? 'FOR' : 'AGAINST' : '-'}
      </Flex>,
    },
    {
      field: 'hasVotedWith',
      label: 'Power',
      tooltip: "Delegate's Voting Power at the time of the Proposal creation that was used when voting",
      header: ({ ...props }) => <Flex justify="center" minWidth={'70px'} {...props} />,
      value: ({ hasVoted, hasVotedWith }: DelegateVote) => <Flex fontWeight="extrabold" justify="center" minWidth={'70px'}>
        {hasVoted ? shortenNumber(hasVotedWith) : '-'}
      </Flex>,
    },
    {
      field: 'status',
      label: 'Status',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={'75px'} {...props} />,
      value: ({ status }: DelegateVote) => <Flex justify="flex-end" minWidth={'75px'}>
        <StatusBadge status={status} />
      </Flex>,
    },
  ];

  return (
    <Container
      label="Voting Activity"
      description="The proposal list is Updated every 15 min"
      contentProps={{ maxW: '90vw', overflowX: 'auto' }}
      collapsable={true}
    >
      <Table
        columns={columns}
        items={proposalsWithVotes}
        keyName={'proposalNum'}
        defaultSort="proposalNum"
        defaultSortDir="desc"
        onClick={({ id, era }: DelegateVote) => router.push(`/governance/proposals/${era}/${id}`)}
      />
    </Container>
  )
}

const SupporterField = ({ address }: { address: string }) => {
  const { addressName } = useNamedAddress(address);
  return (
    (
      <Stack direction="row" align="flex-start" spacing={4} minWidth={'200px'}>
        <Stack direction="row" align="flex-start">
          <Avatar address={address} sizePx={24} />
          <Flex>{addressName}</Flex>
        </Stack>
      </Stack>
    )
  )
}

export const SupportersTable = ({
  delegate,
  delegators,
}: {
  delegate: Partial<Delegate>,
  delegators: Supporter[],
}) => {
  const [isSmaller] = useMediaQuery('(max-width: 500px)')
  const [isOnlyActive, setIsOnlyActive] = useState(true);

  const router = useRouter()

  const columns = [
    {
      field: 'address',
      label: 'Supporter',
      header: ({ ...props }) => <Flex minWidth={'200px'} {...props} />,
      value: ({ address }: Supporter, i: number) => <SupporterField address={address} />
    },
    {
      field: 'delegatedPower',
      label: 'Power',
      tooltip: "The Supporter's Voting Power being delegated",
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={'64px'} {...props} />,
      value: ({ delegatedPower }: Supporter) => <Flex justify="flex-end" minWidth={'64px'}>
        {shortenNumber(delegatedPower, 2, false, true)}
      </Flex>,
    },
  ];

  if (!isSmaller) {
    columns.splice(1, 0,
      {
        field: 'inv',
        label: 'INV',
        header: ({ ...props }) => <Flex justify="center" minWidth={'50px'} {...props} />,
        value: ({ inv }: Supporter) => <Flex justify="center" minWidth={'50px'}>
          {shortenNumber(inv, 2, false, true)}
        </Flex>,
      }
    );
    columns.splice(2, 0, {
      field: 'xinv',
      label: 'Staked INV',
      header: ({ ...props }) => <Flex justify="center" minWidth={'80px'} {...props} />,
      value: ({ xinv }: Supporter) => <Flex justify="center" minWidth={'80px'}>
        {shortenNumber(xinv, 2, false, true)}
      </Flex>,
    })
  }

  const genkidama = delegators.reduce((prev, curr) => prev + curr.delegatedPower, 0);
  const genkidamaPerc = genkidama && delegate?.votingPower ? genkidama / delegate.votingPower * 100 : 0;

  const onlyActive = delegators.filter(d => d.delegatedPower > 0);
  const nbActive = onlyActive.length;

  return (
    <Container
      w='full'
      position="relative"
      collapsable={true}
      label={`${delegators.length} Supporter${delegators.length > 1 ? 's' : ''}${nbActive !== delegators.length ? ` (${nbActive} with power)` : ''} - Updated Every 15 min`}
      description={
        <Stack direction={{ base: 'column', sm: 'row' }} justify="space-between" w='full'>
          <Text fontSize="12px" color="secondaryTextColor">
            Total Power Received Thanks to Supporters: {shortenNumber(genkidama, 2)} => {shortenNumber(genkidamaPerc, 2)}%{genkidamaPerc > 100 ? ' (% > 100 means that the Cached Supporter list differ a bit from live voting power)' : ''}
          </Text>
          <HStack position={{ base: 'static', sm: 'absolute' }} right="24px" alignItems="center">
            <Text fontSize="12px">Only With Power:</Text>
            <Switch isChecked={isOnlyActive} onChange={() => setIsOnlyActive(!isOnlyActive)} />
          </HStack>
        </Stack>
      }
    >
      <Table
        columns={columns}
        items={isOnlyActive ? onlyActive : delegators}
        keyName={'address'}
        defaultSort="delegatedPower"
        defaultSortDir="desc"
        onClick={({ address }: Delegate) => router.push(`/governance/delegates/${address}`)}
      />
    </Container>
  )
}

const DelegatesTable = () => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { delegates, isLoading } = useTopDelegates()
  const router = useRouter()

  const totalVotes = delegates.reduce((totalVotes: number, { votingPower }: Delegate) => (totalVotes += votingPower), 0)

  const columns = [
    {
      field: 'rank',
      label: 'Rank',
      header: ({ ...props }) => <Flex minWidth={64} {...props} />,
      value: ({ address, ensName, rank }: Delegate, i: number) => {
        const { addressName } = useNamedAddress(address, chainId, ensName);
        return (
          (
            <Stack direction="row" align="center" spacing={4} minWidth={64}>
              <Flex w={4} justify="center">
                {rank}
              </Flex>
              <Stack direction="row" align="center">
                <Avatar address={address} sizePx={24} />
                <Flex>{addressName}</Flex>
              </Stack>
            </Stack>
          )
        )
      },
    },
    {
      field: 'delegators',
      label: 'Delegators',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ delegators }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${delegators.length}`}</Flex>,
    },
    {
      field: 'votes',
      label: 'Proposals Voted',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ votes }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${votes.length}`}</Flex>,
    },
    {
      field: 'votingPower',
      label: 'Votes',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ votingPower }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${votingPower.toFixed(2)}`}</Flex>,
    },
    {
      field: 'votingPower',
      label: 'Vote weight',
      header: ({ ...props }) => <Flex justify="flex-end" minWidth={32} {...props} />,
      value: ({ votingPower }: Delegate) => (
        <Flex justify="flex-end" minWidth={32}>{`${((votingPower / totalVotes) * 100).toFixed(2)}%`}</Flex>
      ),
    },
  ]

  if (isLoading) {
    return (
      <Container label="Delegate Top 100 - Updated every 15 min" description="Top delegates by voting weight">
        <SkeletonBlob skeletonHeight={6} noOfLines={4} />
      </Container>
    )
  }

  return (
    <Container label="Delegate Top 100 - Updated every 15 min" description="Top delegates by voting weight">
      <Table
        columns={columns}
        items={delegates.slice(0, 100)}
        keyName={'address'}
        onClick={({ address }: Delegate) => router.push(`/governance/delegates/${address}`)}
      />
    </Container>
  )
}

export const Stake = () => (
  <Layout>
    <Head>
      <title>{process.env.NEXT_PUBLIC_TITLE} - Delegates</title>
    </Head>
    <AppNav active="Governance" />
    <Breadcrumbs
      w="7xl"
      breadcrumbs={[
        { label: 'Governance', href: '/governance' },
        { label: 'Delegates', href: '#' },
      ]}
    />
    <Flex w="full" align="center" direction="column">
      <Flex w={{ base: 'full', xl: '7xl' }} align="center">
        <DelegatesTable />
      </Flex>
    </Flex>
  </Layout>
)

export default Stake
