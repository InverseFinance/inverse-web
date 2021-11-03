import { Flex, Stack } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/common/Avatar'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import Container from '@inverse/components/common/Container'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { SkeletonBlob } from '@inverse/components/common/Skeleton'
import Table from '@inverse/components/common/Table'
import { useTopDelegates } from '@inverse/hooks/useDelegates'
import { Delegate } from '@inverse/types'
import { namedAddress } from '@inverse/util'
import { useRouter } from 'next/dist/client/router'
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';

const DelegatesTable = () => {
  const { chainId } = useWeb3React<Web3Provider>()

  const { delegates, isLoading } = useTopDelegates()
  const router = useRouter()

  const totalVotes = delegates.reduce((totalVotes: number, { votingPower }: Delegate) => (totalVotes += votingPower), 0)

  const columns = [
    {
      header: <Flex minWidth={64}>Rank</Flex>,
      value: ({ address, ensName }: Delegate, i: number) => (
        <Stack direction="row" align="center" spacing={4} minWidth={64}>
          <Flex w={4} justify="center">
            {i + 1}
          </Flex>
          <Stack direction="row" align="center">
            <Avatar address={address} boxSize={6} />
            <Flex>{namedAddress(address, chainId, ensName)}</Flex>
          </Stack>
        </Stack>
      ),
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={32}>
          Delegators
        </Flex>
      ),
      value: ({ delegators }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${delegators.length}`}</Flex>,
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={32}>
          Proposals Voted
        </Flex>
      ),
      value: ({ votes }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${votes.length}`}</Flex>,
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={32}>
          Votes
        </Flex>
      ),
      value: ({ votingPower }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${votingPower.toFixed(2)}`}</Flex>,
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={32}>
          Vote Weight
        </Flex>
      ),
      value: ({ votingPower }: Delegate) => (
        <Flex justify="flex-end" minWidth={32}>{`${((votingPower / totalVotes) * 100).toFixed(2)}%`}</Flex>
      ),
    },
  ]

  if (isLoading) {
    return (
      <Container label="Delegate Leaderboard" description="Top delegates by voting weight">
        <SkeletonBlob skeletonHeight={6} noOfLines={4} />
      </Container>
    )
  }

  return (
    <Container label="Delegate Leaderboard" description="Top delegates by voting weight">
      <Table
        columns={columns}
        items={delegates.slice(0, 100)}
        onClick={({ address }: Delegate) => router.push(`/governance/delegates/${address}`)}
      />
    </Container>
  )
}

export const Stake = () => (
  <Layout>
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
