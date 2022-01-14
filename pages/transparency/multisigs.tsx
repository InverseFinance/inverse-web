import { Flex, Text } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@inverse/components/Transparency/TransparencyTabs'
import { useDAO } from '@inverse/hooks/useDAO'
import { MultisigsFlowChart } from '@inverse/components/Transparency/MultisigsFlowChart'
import { InfoMessage } from '@inverse/components/common/Messages'

export const MultisigsDiagram = () => {
  const { multisigs } = useDAO();

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Multisigs</title>
      </Head>
      <AppNav active="Transparency" />
      <TransparencyTabs active="multisigs" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <MultisigsFlowChart multisigs={multisigs} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <InfoMessage
              alertProps={{ fontSize: '12px', w: 'full' }}
              title="🏛️ Multisigs Purposes"
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Rewards Committee:</Text>
                    <Text>Compensate contributors</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- GWG:</Text>
                    <Text>Investments & Costs regarding Growth</Text>
                  </Flex>
                </>
              }
            />
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default MultisigsDiagram
