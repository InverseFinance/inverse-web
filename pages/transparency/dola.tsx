import { Flex, Text } from '@chakra-ui/react'

import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import Head from 'next/head'
import { InfoMessage } from '@inverse/components/common/Messages'
import { getNetworkConfigConstants } from '@inverse/config/networks';
import { NetworkIds } from '@inverse/types'
import { DolaFlowChart } from '@inverse/components/Transparency/DolaFlowChart'
import { TransparencyTabs } from '@inverse/components/Transparency/TransparencyTabs'
import { useDAO } from '@inverse/hooks/useDAO'
import { shortenNumber } from '@inverse/util/markets'
import { SuppplyInfos } from '@inverse/components/common/Dataviz/SupplyInfos'

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
          <DolaFlowChart dola={DOLA} dolaOperator={dolaOperator||TREASURY} feds={fedsWithData} />
        </Flex>
        <Flex direction="column" p={{ base: '4', xl: '0' }}>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="4" justify="center">
            <SuppplyInfos token={TOKENS[DOLA]} mainnetSupply={dolaTotalSupply - fantom?.dolaTotalSupply} fantomSupply={fantom?.dolaTotalSupply} />
          </Flex>
          <Flex w={{ base: 'full', xl: 'sm' }} mt="5" justify="center">
            <InfoMessage
              title="🦅&nbsp;&nbsp;DOLA Fed Supplies"
              alertProps={{ fontSize: '12px', w: 'full' }}
              description={
                <>
                  {fedsWithData.map(fed => {
                    return <Flex key={fed.address} direction="row" w='full' justify="space-between">
                      <Text>- {fed.name}:</Text>
                      <Text>{shortenNumber(fed.supply)}</Text>
                    </Flex>
                  })}
                  <Flex fontWeight="bold" direction="row" w='full' justify="space-between" alignItems="center">
                    <Text>- Total:</Text>
                    <Text>{shortenNumber(fedsWithData.reduce((prev, curr) => curr.supply + prev, 0))}</Text>
                  </Flex>
                </>
              }
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
