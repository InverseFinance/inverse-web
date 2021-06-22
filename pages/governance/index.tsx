import { Flex } from '@chakra-ui/react'
import { Proposals } from '@inverse/components/Governance'
import { Breakdown } from '@inverse/components/Governance/Breakdown'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'

export const Governance = () => (
  <Layout>
    <AppNav active="Governance" />
    <Flex w="full" justify="center">
      <Proposals />
      <Flex direction="column">
        <Breakdown />
      </Flex>
    </Flex>
  </Layout>
)

export default Governance
