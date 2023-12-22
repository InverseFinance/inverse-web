import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { StakeDolaUI } from '@app/components/sdola/StakeDolaUI';
import { StakeDolaInfos } from '@app/components/sdola/StakeDolaInfos';

export const SdolaPage = () => {
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sDOLA</title>
        <meta name="og:title" content="Inverse Finance - sDOLA" />
        <meta name="og:description" content="sDOLA" />
        <meta name="description" content="sDOLA" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR" />
      </Head>
      <AppNav active="Swap" />
      <Stack
        w={{ base: 'full', lg: '1000px' }}
        justify="center"
        direction={{ base: 'column', xl: 'row' }}
        mt='6'
        alignItems="flex-start"
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <VStack w={{ base: 'full', lg: '55%' }}>
          <StakeDolaUI />
        </VStack>
        <Stack w={{ base: 'full', lg: '45%' }} direction="column" justifyContent="space-between">
          <StakeDolaInfos />
        </Stack>
      </Stack>
    </Layout>
  )
}

export default SdolaPage