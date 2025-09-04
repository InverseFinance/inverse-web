import { VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { PSMui } from '@app/components/Swap/PSMui';

export const PSMPage = () => {
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - PSM</title>
        <meta name="og:title" content="Inverse Finance - PSM" />
        <meta name="og:description" content="PSM" />
        <meta name="description" content="PSM between DOLA and USDS" />
        <meta name="keywords" content="Inverse Finance, PSM, DOLA, USDS" />
      </Head>
      <AppNav active="More" activeSubmenu="PSM" />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <PSMui />
      </VStack>
    </Layout>
  )
}

export default PSMPage