import { VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { PSMui } from '@app/components/Swap/PSMui';
import { PSM_ADDRESS } from '@app/config/constants';

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
      <AppNav active="More" activeSubmenu="PSM" hideAnnouncement={true} />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <PSMui
          collateral={'0xdC035D45d973E3EC169d2276DDab16f1e407384F'}
          collateralSymbol="USDS"
          collateralDecimals={18}
          psm={PSM_ADDRESS}
        />
      </VStack>
    </Layout>
  )
}

export default PSMPage