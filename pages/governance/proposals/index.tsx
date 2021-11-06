import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import { Breakdown, DelegatesPreview, Proposals, VotingWallet } from '@inverse/components/Governance'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'

export const Governance = () => (
  <Layout>
    <AppNav active="Governance" />
    <Breadcrumbs
      w="7xl"
      breadcrumbs={[
        { label: 'Governance', href: '/governance' },
        { label: 'Proposals', href: '#' },
      ]}
    />
    <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
      <Flex direction="column">
        <Flex w={{ base: 'full', xl: '4xl' }} justify="center">
          <Proposals />
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
