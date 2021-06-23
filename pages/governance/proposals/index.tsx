import { Flex } from '@chakra-ui/react'
import { Breadcrumbs } from '@inverse/components/Breadcrumbs'
import { Proposals, Breakdown, DelegatesPreview } from '@inverse/components/Governance'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'

export const Governance = () => (
  <Layout>
    <AppNav active="Governance" />
    <Breadcrumbs
      breadcrumbs={[
        { label: 'Governance', href: '/governance' },
        { label: 'Proposals', href: '#' },
      ]}
    />
    <Flex w="full" justify="center">
      <Proposals />
      <Flex direction="column">
        <Breakdown />
        <DelegatesPreview />
      </Flex>
    </Flex>
  </Layout>
)

export default Governance
