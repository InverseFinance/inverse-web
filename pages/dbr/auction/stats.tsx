import { HStack, VStack, Text } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { DbrAuctionBuys } from '@app/components/F2/DbrAuction/DbrAuctionBuys';
import { DbrAuctionBuysChart } from '@app/components/F2/DbrAuction/DbrAuctionBuysChart';
import Container from '@app/components/common/Container';
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader';
import { preciseCommify } from '@app/util/misc';
import { DbrAuctionTabs } from '@app/components/F2/DbrAuction/DbrAuctionTabs';
import { useDbrAuctionActivity } from '@app/util/dbr-auction';
import { SkeletonBlob } from '@app/components/common/Skeleton';

export const DbrAuctionStatsPage = () => {
  const { isLoading, events, accDolaIn, accDbrOut, timestamp } = useDbrAuctionActivity();
  console.log(events)
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - DBR auction</title>
        <meta name="og:title" content="Inverse Finance - DBR auction stats" />
        <meta name="og:description" content="DBR auction stats" />
        <meta name="description" content="DBR auction stats" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR, auction" />
      </Head>
      <AppNav active="Swap" activeSubmenu="Buy DBR (auction)" />
      <DbrAuctionTabs defaultIndex={1} />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <DbrAuctionBuys lastUpdate={timestamp} events={events} title="DBR buys from the auction" />
        <Container
          label="DBR auction stats"
          description="Note: All the DOLA income from the DBR auctions goes to DOLA bad debt repayments."
          noPadding
          m="0"
          p="0"
          headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
          }}
          right={
            <HStack justify="space-between" spacing="4">
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">Total DOLA income</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(accDolaIn, 2)}</Text>
                }
              </VStack>
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">Total DBR auctioned</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(accDbrOut, 2)}</Text>
                }
              </VStack>
            </HStack>
          }
        >
          {
            isLoading ?
              <SkeletonBlob />
              : <DbrAuctionBuysChart events={events} />
          }
        </Container>
      </VStack>
    </Layout>
  )
}

export default DbrAuctionStatsPage