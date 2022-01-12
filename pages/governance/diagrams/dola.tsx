import { Flex, Text } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { Breadcrumbs } from '@inverse/components/common/Breadcrumbs'
import { InfoMessage } from '@inverse/components/common/Messages'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds } from '@inverse/types'
import useEtherSWR from '@inverse/hooks/useEtherSWR'
import { DolaFlowChart } from '@inverse/components/common/Dataviz/DolaFlowChart'

const { DOLA, TREASURY, FEDS } = getNetworkConfigConstants(NetworkIds.mainnet);

const DEPLOYER = '0x3FcB35a1CbFB6007f9BC638D388958Bc4550cB28'

export const DolaDiagram = () => {
  const { data: dolaData } = useEtherSWR([
    [DOLA, 'operator'],
  ])

  const { data: fetchedFedData } = useEtherSWR([
    ...FEDS.map(fed => [fed, 'chair']),
    ...FEDS.map(fed => [fed, 'gov']),
    ...FEDS.map(fed => [fed, 'ctoken']),
  ])

  const fedData = fetchedFedData || [DEPLOYER, DEPLOYER, TREASURY, TREASURY, '', ''];

  const feds = FEDS.map(((fed, i) => {
    return {
      address: fed,
      chair: fedData[i],
      gov: fedData[FEDS.length + i],
      ctoken: fedData[2 * FEDS.length + i],
    }
  }))

  const [dolaOperator] = dolaData || [DEPLOYER];

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Dola FlowChart</title>
      </Head>
      <AppNav active="Governance" />
      <Breadcrumbs
        w="7xl"
        breadcrumbs={[
          { label: 'Governance', href: '/governance' },
          { label: 'Diagrams', href: '/governance/diagrams' },
          { label: 'DOLA', href: '#' },
        ]}
      />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column">
          <DolaFlowChart dola={DOLA} dolaOperator={dolaOperator} feds={feds} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          <Flex w={{ base: 'full', xl: 'sm' }} justify="center">
            <InfoMessage
              title="⚡ Roles & Powers"
              alertProps={{ fontSize: '12px', w: 'full' }}
              description={
                <>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Dola operator:</Text>
                    <Text>Can add/remove DOLA minters</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Fed Chair:</Text>
                    <Text>Can resize the amount of DOLA supplied</Text>
                  </Flex>
                  <Flex direction="row" w='full' justify="space-between">
                    <Text>- Fed Gov:</Text>
                    <Text>Can change the Fed Chair</Text>
                  </Flex>
                </>
              }
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">

          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default DolaDiagram
