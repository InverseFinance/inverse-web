import { Flex } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { DatavizTabs } from '@inverse/components/common/Dataviz/DatavizTabs'

export const MultisigsDiagram = () => {

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Multisigs</title>
      </Head>
      <AppNav active="Transparency" />
      <DatavizTabs active="dola" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          
        </Flex>
      </Flex>
    </Layout>
  )
}

export default MultisigsDiagram
