import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { ShrinkableInfoMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { DolaFlowChart } from '@app/components/Transparency/DolaFlowChart'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO, useFedOverview } from '@app/hooks/useDAO'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'
import { FedList } from '@app/components/Transparency/fed/FedList'
import { usePrices } from '@app/hooks/usePrices'
import { DolaSupplies } from '@app/components/common/Dataviz/DolaSupplies'
import { DolaCircSupplyEvolution } from '@app/components/Transparency/DolaCircSupplyEvolution'

const { DOLA, TOKENS, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);

export const DolaDiagram = () => {
  const { dolaOperator, dolaSupplies, feds, isLoading } = useDAO();
  const { fedOverviews, isLoading: isLoadingOverview } = useFedOverview();
  const { prices } = usePrices(['velodrome-finance']);

  const fedsWithData = feds;

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Dola</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Dola & the Feds" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Dola & the Feds" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, dola, fed, expansion, contraction, supply" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="DOLA & Feds" hideAnnouncement={true} />
      <TransparencyTabs active="dola" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }} ml="2">
        <Flex direction="column">
          <FedList prices={prices} feds={fedOverviews.filter(f => !f.hasEnded)} isLoading={isLoadingOverview} />
          <DolaCircSupplyEvolution />
          <Flex mt="4" p="2">
            <DolaFlowChart dola={DOLA} dolaOperator={dolaOperator || TREASURY} feds={fedsWithData} />
          </Flex>
        </Flex>
        <VStack spacing={4} direction="column" pt="4" px={{ base: '4', xl: '0' }} w={{ base: 'full', xl: 'sm' }}>
          <DolaMoreInfos />
          <DolaSupplies supplies={dolaSupplies.filter(chain => chain.supply > 0)} />
          <ShrinkableInfoMessage
            title="⚡&nbsp;&nbsp;Roles & Powers"
            description={
              <>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Dola operator:</Text>
                  <Text>Add/remove DOLA minters</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Fed Chair:</Text>
                  <Text>Resize the amount of DOLA supplied</Text>
                </Flex>
                <Flex direction="row" w='full' justify="space-between">
                  <Text fontWeight="bold">- Fed Gov:</Text>
                  <Text>Change the Fed Chair</Text>
                </Flex>
              </>
            }
          />
        </VStack>
      </Flex>
    </Layout>
  )
}

export default DolaDiagram
