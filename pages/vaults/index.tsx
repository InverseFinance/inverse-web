import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/Layout'
import { AppNav } from '@inverse/components/Navbar'
import { VaultsView } from '@inverse/components/Vaults'

export const Vaults = () => (
  <Layout>
    <AppNav active="Vaults" />
    <Flex justify="center" direction="column">
      <Flex w={{ base: 'full', xl: 'xl' }}>
        <VaultsView />
      </Flex>
    </Flex>
  </Layout>
)

export default Vaults
