import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { StakeDolaUI } from '@app/components/sDola/StakeDolaUI';
import { StakeDolaInfos } from '@app/components/sDola/StakeDolaInfos';
import { useAccount } from '@app/hooks/misc';
import { StakeDolaActivity, useStakedDolaActivity } from '@app/components/sDola/StakeDolaActivity';
import { DolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';

export const SdolaPage = () => {
  const account = useAccount();
  // const { isLoading, accountEvents, events } = useStakedDolaActivity(account);
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
      <DolaStakingTabs />
      <VStack
        w={{ base: 'full', lg: '1000px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <Stack
          spacing="0"
          alignItems="space-between"
          justify="space-between"
          w='full'
          direction={{ base: 'column', xl: 'row' }}
        >
          <VStack alignItems="flex-start" w={{ base: 'full', lg: '55%' }}>
            <StakeDolaUI />
          </VStack>
          <Stack alignItems="flex-end" w={{ base: 'full', lg: '45%' }}>
            <StakeDolaInfos />
          </Stack>
        </Stack>
        {/* <StakeDolaActivity events={accountEvents} /> */}
      </VStack>
    </Layout>
  )
}

export default SdolaPage