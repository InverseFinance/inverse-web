import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { DbrAuctionBuyer } from '@app/components/F2/DbrAuction/DbrAuctionBuyer';
import { DbrAuctionIntroMsg } from '@app/components/F2/DbrAuction/DbrAuctionInfos';
import { DbrAuctionBuys } from '@app/components/F2/DbrAuction/DbrAuctionBuys';
import { useAccount } from '@app/hooks/misc';
import { useDbrAuctionActivity } from '@app/util/dbr-auction';
import { DbrAuctionTabs } from '@app/components/F2/DbrAuction/DbrAuctionTabs';

export const DbrAuctionPage = () => {
  const account = useAccount();  
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
              <DbrAuctionBuyer title="DBR XY=K Auction" />
            </VStack>
            <Stack alignItems="flex-end" w={{ base: 'full', lg: '45%' }}>
              <DbrAuctionIntroMsg />
            </Stack>
          </Stack>
        </VStack>
        <DbrAuctionBuys lastUpdate={timestamp} events={accountEvents} title="My past DBR buys from the auction" />
      </VStack>
    </Layout>
  )
}

export default DbrAuctionPage