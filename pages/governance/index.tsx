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

export const Governance = () => (
  <Layout>
    <AppNav active="Governance" />
    <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
          <ActiveProposals />
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
