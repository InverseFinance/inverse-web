import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { StakeDolaUI } from '@app/components/sDola/StakeDolaUI';
import { StakeDolaInfos } from '@app/components/sDola/StakeDolaInfos';
import { useAccount } from '@app/hooks/misc';
import { DolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';
import { DolaStakingActivity } from '@app/components/sDola/DolaStakingActivity';
import { useDolaStakingActivity } from '@app/util/dola-staking';

export const SdolaPage = () => {
  const account = useAccount();
  const { isLoading, accountEvents, events } = useDolaStakingActivity(account, 'sdola');
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sDOLA</title>
        <meta name="og:title" content="Inverse Finance - sDOLA" />
        <meta name="og:description" content="sDOLA" />
        <meta name="description" content="sDOLA is a decentralized yield-bearing stablecoin that leverages organic yield from the DOLA Savings Account" />
        <meta name="keywords" content="Inverse Finance, sDOLA, yield-bearing stablecoin, staked DOLA" />
      </Head>
      <AppNav active="sDOLA" activeSubmenu="sDOLA" />
      <DolaStakingTabs />
      <VStack
        w={{ base: 'full', lg: '1000px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <Stack
          spacing={{ base: 4, xl: 0 }}
          alignItems="space-between"
          justify="space-between"
          w='full'
          direction={{ base: 'column', xl: 'row' }}
        >
          <VStack alignItems={{ base: 'center', xl: 'flex-start' }} w={{ base: 'full', lg: '55%' }}>
            <StakeDolaUI />
          </VStack>
          <Stack alignItems={{ base: 'center', xl: 'flex-start' }} w={{ base: 'full', lg: '45%' }}>
            <StakeDolaInfos />
          </Stack>
        </Stack>
        <DolaStakingActivity events={accountEvents} title="My Staking activity" />
      </VStack>
    </Layout>
  )
}

export default SdolaPage