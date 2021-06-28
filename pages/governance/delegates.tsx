import { Flex, Stack } from '@chakra-ui/react'
import { Avatar } from '@inverse/components/Avatar'
import { Breadcrumbs } from '@inverse/components/Breadcrumbs'
import Container from '@inverse/components/Container'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import Table from '@inverse/components/Table'
import { useDelegates } from '@inverse/hooks/useDelegates'
import { Delegate } from '@inverse/types'
import { smallAddress } from '@inverse/util'

const DelegatesTable = () => {
  const { delegates } = useDelegates()

  const totalVotes = delegates.reduce((totalVotes: number, { balance }: Delegate) => (totalVotes += balance), 0)

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
      value: ({ balance }: Delegate) => <Flex justify="flex-end" minWidth={32}>{`${balance.toFixed(2)}`}</Flex>,
    },
    {
      header: (
        <Flex justify="flex-end" minWidth={32}>
          Vote Weight
        </Flex>
      ),
      value: ({ balance }: Delegate) => (
        <Flex justify="flex-end" minWidth={32}>{`${((balance / totalVotes) * 100).toFixed(2)}%`}</Flex>
      ),
    },
  ]

  return (
    <Container label="Delegate Leaderboard" description="Top delegates by voting weight">
      <Table columns={columns} items={delegates.slice(0, 100)} />
    </Container>
  )
}

export const Stake = () => (
  <Layout>
    <AppNav active="Stake" />
    <Breadcrumbs
      w="7xl"
      breadcrumbs={[
        { label: 'Governance', href: '/governance' },
        { label: 'Delegates', href: '#' },
      ]}
    />
    <Flex w="full" justify="center" direction="column">
      <Flex w={{ base: 'full', xl: '7xl' }} align="center">
        <DelegatesTable />
      </Flex>
    </Flex>
  </Layout>
)

export default Stake
