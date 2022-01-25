import { Flex, Text } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { InfoMessage } from '@app/components/common/Messages'
import { getNetworkConfigConstants } from '@app/util/networks';
import { NetworkIds } from '@app/types'
import { DolaFlowChart } from '@app/components/Transparency/DolaFlowChart'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { useDAO } from '@app/hooks/useDAO'
import { SuppplyInfos } from '@app/components/common/Dataviz/SupplyInfos'
import { DolaMoreInfos } from '@app/components/Transparency/DolaMoreInfos'

const { DOLA, TOKENS, FEDS, DEPLOYER, TREASURY } = getNetworkConfigConstants(NetworkIds.mainnet);

const defaultFeds = FEDS.map(((fed) => {
  return {
    ...fed,
    supply: 0,
    chair: DEPLOYER,
    gov: TREASURY,
  }
}))

export const DolaDiagram = () => {
  const { dolaTotalSupply, dolaOperator, fantom, feds } = useDAO();

  const fedsWithData = feds?.length > 0 ? feds : defaultFeds;

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Dola</title>
      </Head>
      <AppNav active="Transparency" />
      <TransparencyTabs active="dola" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <Flex direction="column" py="2">
          <DolaFlowChart dola={DOLA} dolaOperator={dolaOperator || TREASURY} feds={fedsWithData} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="4" justify="center">
            <DolaMoreInfos />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="4" justify="center">
            <SuppplyInfos token={TOKENS[DOLA]} supplies={[
              { chainId: NetworkIds.mainnet, supply: dolaTotalSupply - fantom?.dolaTotalSupply },
              { chainId: NetworkIds.ftm, supply: fantom?.dolaTotalSupply },
            ]}
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <SuppplyInfos
              title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
              supplies={fedsWithData}
            />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <InfoMessage
              title="⚡&nbsp;&nbsp;Roles & Powers"
              alertProps={{ fontSize: '12px', w: 'full' }}
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
          </Flex>
        </Flex>
      </Flex>
    </Layout>
  )
}

export default DolaDiagram
