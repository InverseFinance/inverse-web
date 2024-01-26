import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { DbrAuctionBuyer } from '@app/components/F2/DbrAuction/DbrAuctionBuyer';
import { DbrAuctionIntroMsg } from '@app/components/F2/DbrAuction/DbrAuctionInfos';
import { DbrAuctionBuys } from '@app/components/F2/DbrAuction/DbrAuctionBuys';
import { useAccount } from '@app/hooks/misc';
import { useState } from 'react';
import { useDbrAuctionActivity } from '@app/util/dbr-auction';
import { DbrAuctionType } from '@app/types';
import { DbrAuctionTabs } from '@app/components/F2/DbrAuction/DbrAuctionTabs';
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS, DOLA_SAVINGS_ADDRESS, SDOLA_HELPER_ADDRESS } from '@app/config/constants';

const AUCTION_TYPES = {
  'classic': {
    auction: DBR_AUCTION_ADDRESS,
    helper: DBR_AUCTION_HELPER_ADDRESS,
  },
  'sdola': {
    auction: DOLA_SAVINGS_ADDRESS,
    helper: SDOLA_HELPER_ADDRESS,
  },
}

export const DbrAuctionPage = () => {
  const account = useAccount();
  const [selectedAuction, setSelectedAuction] = useState<DbrAuctionType>('classic');
  const { isLoading, accountEvents, events, nbBuys, accDolaIn, accDbrOut, avgDbrPrice, timestamp } = useDbrAuctionActivity(account);
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - DBR auction</title>
        <meta name="og:title" content="Inverse Finance - DBR auction" />
        <meta name="og:description" content="DBR auction" />
        <meta name="description" content="DBR auction" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR, auction" />
      </Head>
      <AppNav active="Swap" activeSubmenu="Buy DBR (auction)" />
      <DbrAuctionTabs />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <VStack spacing="4">          
          <Stack
            spacing="0"
            alignItems="space-between"
            justify="space-between"
            w='full'
            direction={{ base: 'column', xl: 'row' }}
          >
            <VStack alignItems="flex-start" w={{ base: 'full', lg: '55%' }}>
              <DbrAuctionBuyer title="General DBR XY=K Auction" helperAddress={AUCTION_TYPES['classic'].helper} />
            </VStack>
            <Stack alignItems="flex-end" w={{ base: 'full', lg: '45%' }}>
              <DbrAuctionBuyer title="sDOLA DBR XY=K Auction" helperAddress={AUCTION_TYPES['sdola'].helper} />
            </Stack>
          </Stack>
          <DbrAuctionIntroMsg />
        </VStack>
        <DbrAuctionBuys lastUpdate={timestamp} events={accountEvents} title="My past DBR buys from the auction" />
      </VStack>
    </Layout>
  )
}

export default DbrAuctionPage