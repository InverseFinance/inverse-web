import { Flex } from '@chakra-ui/react'
import {
  ActiveProposals,
  Breakdown,
  DelegatesPreview,
  RecentProposals,
  VotingWallet,
} from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { Link } from '@inverse/components/common/Link'
import Head from 'next/head'

export const Governance = () => (
  <Layout>
    <Head>
      <title>Inverse Finance - Governance</title>
    </Head>
    <AppNav active="Governance" />
    <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
          <ActiveProposals />
        </Flex>
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
          <Link fontSize="12" mt="2" href={`/governance/propose`}>Submit a new Proposal</Link>
        </Flex>
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
          <RecentProposals />
        </Flex>
      </Flex>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <VotingWallet />
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <Breakdown />
        </Flex>
        <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
          <DelegatesPreview />
        </Flex>
      </Flex>
    </Flex>
  </Layout>
)

export default Governance
