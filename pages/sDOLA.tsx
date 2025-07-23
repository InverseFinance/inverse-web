import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { StakeDolaUI } from '@app/components/sDola/StakeDolaUI';
import { useAccount } from '@app/hooks/misc';
import { DolaStakingTabs } from '@app/components/F2/DolaStaking/DolaStakingTabs';
import { DolaStakingActivity } from '@app/components/sDola/DolaStakingActivity';
import { useDolaStakingActivity } from '@app/util/dola-staking';
import { DbrAuctionBuysSDola } from '@app/components/F2/DbrAuction/DbrAuctionBuys';
import { SDolaInsuranceCover } from '@app/components/common/InsuranceCover';
import { SavingsOpportunities, useSavingsOpportunities } from '@app/components/sDola/SavingsOpportunities';
import { ErrorBoundary } from '@app/components/common/ErrorBoundary';
import { SDolaComparator } from '@app/components/F2/SDolaComparator';

export const SdolaPage = () => {
  const account = useAccount();
  const { accountEvents } = useDolaStakingActivity(account, 'sdola');
  
  const { tokenAndBalances, totalStables, topStable, useDolaAsMain, isLoading: isLoadingStables } = useSavingsOpportunities(account);

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sDOLA</title>
        <meta name="og:title" content="Inverse Finance - sDOLA" />
        <meta name="og:description" content="sDOLA" />
        <meta name="description" content="sDOLA is a decentralized yield-bearing stablecoin that leverages organic yield from the DOLA Savings Account" />
        <meta name="keywords" content="Inverse Finance, sDOLA, yield-bearing stablecoin, staked DOLA" />
        <meta name="og:image" content="https://inverse.finance/assets/sDOLAx512.png" />
      </Head>
      <AppNav active="Stake" activeSubmenu="sDOLA" hideAnnouncement={true} />
      <DolaStakingTabs />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
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
          <VStack spacing="10" alignItems={"center"} w={{ base: 'full' }}>
            <SavingsOpportunities tokenAndBalances={tokenAndBalances} totalStables={totalStables} />
            <StakeDolaUI isLoadingStables={isLoadingStables} useDolaAsMain={useDolaAsMain} topStable={topStable} />
            <SDolaInsuranceCover />
            <ErrorBoundary>
              <SDolaComparator title="Compare sDOLA" />
            </ErrorBoundary>
          </VStack>
        </Stack>
        {
          !!account && accountEvents?.length > 0 && <DolaStakingActivity events={accountEvents} title="My Staking activity" />
        }
        <DbrAuctionBuysSDola />
      </VStack>
    </Layout>
  )
}

export default SdolaPage