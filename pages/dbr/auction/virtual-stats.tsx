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
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { useDbrAuction } from '@app/components/F2/DbrAuction/DbrAuctionInfos';

export const DbrAuctionVirtualStatsPage = () => {
  const { dbrSaleHandlerRepayPercentage, isLoading, virtualAuctionEvents: events, accDolaInVirtual: accDolaIn, accDbrOutVirtual: accDbrOut, accVirtualWorthOut, timestamp } = useDbrAuctionActivity();  
  const { historicalRates } = useDbrAuction('classic');
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - DBR Virtual Auction</title>
        <meta name="og:title" content="Inverse Finance - DBR Virtual Auction" />
        <meta name="og:description" content="DBR Virtual Auction" />
        <meta name="description" content="DBR Virtual Auction" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR, auction" />
      </Head>
      <AppNav active="Stake" activeSubmenu="Buy DBR (auction)" />
      <DbrAuctionTabs defaultIndex={2} />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <Container
          label="DBR Virtual Auction"
          description={`Note: ${smartShortNumber(dbrSaleHandlerRepayPercentage, 2)}% of the Virtual auction income goes to bad debt reduction`}
          noPadding
          m="0"
          p="0"
          headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
          }}
          right={
            <HStack justify="space-between" spacing="4">
              <VStack spacing="0" alignItems={{ base: 'left', md: 'center' }}>
                <Text textAlign={{ base: 'left', md: 'center' }} fontWeight="bold">Total DOLA income</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign={{ base: 'left', md: 'center' }} color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(accDolaIn, 2)}</Text>
                }
              </VStack>
              <VStack spacing="0" alignItems={{ base: 'left', md: 'center' }}>
                <Text textAlign={{ base: 'left', md: 'center' }} fontWeight="bold">Total DBR auctioned</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign={{ base: 'left', md: 'center' }} color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(accDbrOut, 2)} {accVirtualWorthOut > 0 ? `(${shortenNumber(accVirtualWorthOut, 2, true)})` : ''}</Text>
                }
              </VStack>
            </HStack>
          }
        >
          {
            isLoading ?
              <SkeletonBlob />
              : <DbrAuctionBuysChart historicalRates={historicalRates} auctionType='virtual' isTotal={false} events={events} chartEvents={events} />
          }
        </Container>
        <DbrAuctionBuys lastUpdate={timestamp} events={events.slice(0, 100)} title="Last 100 DBR buys from the auction" />
      </VStack>
    </Layout>
  )
}

export default DbrAuctionVirtualStatsPage