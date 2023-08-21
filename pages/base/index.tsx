import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { BaseBridge } from '@app/components/Swap/BaseBridge';

export const Swap = () => {
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Base</title>
        <meta name="og:title" content="Inverse Finance - Base" />
        <meta name="og:description" content="Base bridging" />
        <meta name="description" content="Base bridging" />
        <meta name="keywords" content="Inverse Finance, swap, bridge, stablecoin, DOLA, DAI, USDT, USDC, INV, DBR" />
      </Head>
      <AppNav active="Swap" activeSubmenu="Base" />
      <Stack
        w={{ base: 'full', lg: '600px' }}
        justify="center"
        direction={{ base: 'column', xl: 'row' }}
        mt='6'
        alignItems="flex-start"
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
         <VStack>            
            <BaseBridge />
          </VStack>
      </Stack>
    </Layout>
  )
}

export default Swap