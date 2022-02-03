import { Flex, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO } from '@app/hooks/useDAO'
import { MultisigsFlowChart } from '@app/components/Transparency/MultisigsFlowChart'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { usePrices } from '@app/hooks/usePrices'
import { Funds } from '@app/components/Transparency/Funds'
import Link from '@app/components/common/Link'
import { ExternalLinkIcon } from '@chakra-ui/icons';

export const MultisigsDiagram = () => {
  const { multisigs } = useDAO();
  const { prices } = usePrices();

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Transparency Multisigs</title>
      </Head>
      <AppNav active="Transparency" />
      <TransparencyTabs active="multisigs" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <MultisigsFlowChart multisigs={multisigs} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          <Flex mb="2" w={{ base: 'full', xl: 'sm' }} justify="center">
            <ShrinkableInfoMessage
              title={<>🏛️ Multisig Wallets Purposes (<Link isExternal display="inline-block" href="https://help.gnosis-safe.io/en/articles/3876456-what-is-gnosis-safe">More Infos <ExternalLinkIcon mb="2px" /></Link>)</>}
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">- Policy Committee:</Text>
                    <Text>Handle Reward Rates Policies</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">- GWG:</Text>
                    <Text>Investments & Costs regarding Growth</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">- Rewards Committee:</Text>
                    <Text>Compensate contributors</Text>
                  </Flex>
                </>
              }
            />
          </Flex>
          {
            multisigs?.map(multisig => {
              return <Flex key={multisig.name} my="2" w={{ base: 'full', xl: 'sm' }} justify="center">
                <ShrinkableInfoMessage
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
                      <Funds prices={prices} funds={multisig.funds} showPerc={false} />
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
