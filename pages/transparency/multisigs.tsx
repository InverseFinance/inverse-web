import { Flex, Text } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@inverse/components/Transparency/TransparencyTabs'
import { useDAO } from '@inverse/hooks/useDAO'
import { MultisigsFlowChart } from '@inverse/components/Transparency/MultisigsFlowChart'
import { InfoMessage } from '@inverse/components/common/Messages'
import { usePrices } from '@inverse/hooks/usePrices'
import { Funds } from '@inverse/components/Transparency/Funds'

export const MultisigsDiagram = () => {
  const { multisigs } = useDAO();
  const { prices } = usePrices();

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
          <Flex mb="2" w={{ base: 'full', xl: 'sm' }} justify="center">
            <InfoMessage
              alertProps={{ fontSize: '12px', w: 'full' }}
              title="🏛️ Multisigs Purposes"
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">- Rewards Committee:</Text>
                    <Text>Compensate contributors</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">- GWG:</Text>
                    <Text>Investments & Costs regarding Growth</Text>
                  </Flex>
                </>
              }
            />
          </Flex>
          {
            multisigs?.map(multisig => {
              return <Flex my="2" w={{ base: 'full', xl: 'sm' }} justify="center">
                <InfoMessage
                  alertProps={{ fontSize: '12px', w: 'full' }}
                  title={`👥 ${multisig.name}`}
                  description={
                    <>
                      <Flex direction="row" w='full' justify="space-between">
                        <Text>- Required approvals to act:</Text>
                        <Text>{multisig.threshold} out of {multisig.owners.length} the members</Text>
                      </Flex>
                      <Flex mt="5" direction="row" w='full' justify="space-between">
                        <Text fontWeight="bold">Multisig Wallet Funds:</Text>
                      </Flex>
                      <Funds prices={prices} funds={multisig.funds} />
                    </>
                  }
                />
              </Flex>
            })
          }
        </Flex>
      </Flex>
    </Layout>
  )
}

export default MultisigsDiagram
