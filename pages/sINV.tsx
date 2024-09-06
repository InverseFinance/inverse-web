import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useAccount } from '@app/hooks/misc';
import { useDbrAuctionActivity } from '@app/util/dbr-auction';
import { StakeInvUI } from '@app/components/sINV/StakeInvUI';
import { SINVTabs } from '@app/components/sINV/sINVTabs';
import { useInvStakingActivity } from '@app/util/sINV';

export const SdolaPage = () => {
  const account = useAccount();
  const { isLoading, accountEvents, events } = useInvStakingActivity(account, 'sinv');
  const { isLoading: isLoadingBuys, events: buyEvents } = useDbrAuctionActivity();
  const sinvBuyEvents = buyEvents.filter(e => e.auctionType === 'sINV');
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - sINV</title>
        <meta name="og:title" content="Inverse Finance - sINV" />
        <meta name="og:description" content="sINV" />
        <meta name="description" content="sINV is a decentralized yield-bearing stablecoin that leverages organic yield from the DOLA Savings Account" />
        <meta name="keywords" content="Inverse Finance, sINV, yield-bearing stablecoin, staked DOLA" />
        <meta name="og:image" content="https://inverse.finance/assets/sDOLAx512.png" />
      </Head>
      <AppNav active="sINV" activeSubmenu="sINV" />
      <SINVTabs />
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
            <StakeInvUI />            
          </VStack>
        </Stack>
        {
          !!account && accountEvents?.length > 0 &&  <DolaStakingActivity events={accountEvents} title="My Staking activity" />
        }
      </VStack>
    </Layout>
  )
}

export default SdolaPage