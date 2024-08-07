import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useWeb3React } from '@web3-react/core';
import { BlastBridge } from '@app/components/Blast/BlastBridge';
import { BlastBridgeInformations } from '@app/components/Blast/BlastBridgeInformations';
import { BlastWithdrawlsSection } from '@app/components/Blast/BlastWithdrawlsSection';

export const BlastPage = () => {
  const { account } = useWeb3React();
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Blast</title>
        <meta name="og:title" content="Inverse Finance - Blast" />
        <meta name="og:description" content="Blast bridging" />
        <meta name="description" content="Blast bridging" />
        <meta name="keywords" content="Inverse Finance, blast, bridge, stablecoin, DOLA" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/blast.png" />
      </Head>
      <AppNav active="More" activeSubmenu="Native Blast Bridge" />
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
            <BlastBridge />
          </VStack>
          <VStack w={{ base: 'full', lg: '45%' }}>
            <BlastBridgeInformations />
          </VStack>
        </Stack>
        {
          !!account && <BlastWithdrawlsSection />
        }
      </VStack>
    </Layout>
  )
}

export default BlastPage