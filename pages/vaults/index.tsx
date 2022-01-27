import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { VaultsView } from '@app/components/Vaults'
import Head from 'next/head'

export const Vaults = () => (
  <Layout>
    <Head>
      <title>{process.env.NEXT_PUBLIC_TITLE} - Vaults</title>
    </Head>
    <AppNav active="Vaults" />
    <Flex justify="center" direction="column">
      <Flex minW={{ base: '300px', lg: '600px' }} w={{ base: 'full', xl: 'xl' }}>
        <VaultsView />
      </Flex>
    </Flex>
  </Layout>
)

export default Vaults
