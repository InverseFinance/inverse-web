import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { VaultsView } from '@inverse/components/Vaults'
import Head from 'next/head'

export const Vaults = () => (
  <Layout>
    <Head>
      <title>Inverse Finance - Vaults</title>
    </Head>
    <AppNav active="Vaults" />
    <Flex justify="center" direction="column">
      <Flex minW={{ base: '500px' }} w={{ base: 'full', xl: 'xl' }}>
        <VaultsView />
      </Flex>
    </Flex>
  </Layout>
)

export default Vaults
