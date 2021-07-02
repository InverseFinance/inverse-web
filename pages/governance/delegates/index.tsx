import { Flex, Stack } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/Avatar'
import { Breadcrumbs } from '@inverse/components/Breadcrumbs'
import Container from '@inverse/components/Container'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { SkeletonBlob } from '@inverse/components/Skeleton'
import Table from '@inverse/components/Table'
import { useTopDelegates } from '@inverse/hooks/useDelegates'
import { Delegate } from '@inverse/types'
import { smallAddress } from '@inverse/util'
import { useRouter } from 'next/dist/client/router'

const DelegatesTable = () => {
  const { delegates, isLoading } = useTopDelegates()
  const router = useRouter()

  const totalVotes = delegates.reduce((totalVotes: number, { votingPower }: Delegate) => (totalVotes += votingPower), 0)

  const columns = [
    {
      header: <Flex minWidth={48}>Rank</Flex>,
      value: ({ address }: Delegate, i: number) => (
        <Stack direction="row" align="center" spacing={4} minWidth={48}>
          <Flex w={4} justify="center">
            {i + 1}
          </Flex>
          <Stack direction="row" align="center">
            <Avatar address={address} boxSize={6} />
            <Flex>{smallAddress(address)}</Flex>
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
