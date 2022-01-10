import { Flex } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { FlowChart } from '@inverse/components/common/Dataviz/FlowChart'

export const Governance = () => {

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Governance</title>
      </Head>
      <AppNav active="Governance" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <FlowChart />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Governance
