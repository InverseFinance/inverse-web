import { Stack, VStack, Text } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { BaseBridge } from '@app/components/Base/BaseBridge';
import { BaseWithdrawlsSection } from '@app/components/Base/BaseWithdrawlsSection';
import { BaseBridgeInformations } from '@app/components/Base/BaseBridgeInformations';
import { useWeb3React } from '@web3-react/core';
import { InfoMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';

export const BasePage = () => {
  const { account } = useWeb3React();
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Base</title>
        <meta name="og:title" content="Inverse Finance - Base" />
        <meta name="og:description" content="Base bridging" />
        <meta name="description" content="Base bridging" />
        <meta name="keywords" content="Inverse Finance, base, bridge, stablecoin, DOLA" />
      </Head>
      <AppNav active="More" activeSubmenu="Native Base Bridge" />
      <InfoMessage
        alertProps={{ w: { base: 'full', lg: '1200px' }, mt: '4' }}
        description={
          <VStack spacing="2" alignItems="flex-start">
            <Text>We now recommend to use the Superbridge app which has more advanced features:</Text>
            <Link textDecoration="underline" href="https://superbridge.app/base" isExternal target="_blank">
              Open the Superbridge app
            </Link>
            <Text>DOLA address on Base: <b>0x4621b7A9c75199271F773Ebd9A499dbd165c3191</b></Text>
          </VStack>
        } />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        justify="center"
        mt='6'
        alignItems="flex-start"
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <Stack
          w='full'
          justify="center"
          direction={{ base: 'column', xl: 'row' }}
          alignItems="flex-start"
          spacing="8"
        >
          <VStack w={{ base: 'full', lg: '55%' }}>
            <BaseBridge />
          </VStack>
          <VStack w={{ base: 'full', lg: '45%' }}>
            <BaseBridgeInformations />B
          </VStack>
        </Stack>
        {
          !!account && <BaseWithdrawlsSection />
        }
      </VStack>
    </Layout>
  )
}

export default BasePage