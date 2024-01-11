import { HStack, Stack, VStack, Text } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { DbrAuctionBuyer } from '@app/components/F2/DbrAuction/DbrAuctionBuyer';
import { DbrAuctionInfos } from '@app/components/F2/DbrAuction/DbrAuctionInfos';
import { DbrAuctionBuys, useDbrAuctionBuys } from '@app/components/F2/DbrAuction/DbrAuctionBuys';
import { DbrAuctionBuysChart } from '@app/components/F2/DbrAuction/DbrAuctionBuysChart';
import { useAccount } from '@app/hooks/misc';
import Container from '@app/components/common/Container';
import { SmallTextLoader } from '@app/components/common/Loaders/SmallTextLoader';
import { shortenNumber } from '@app/util/markets';
import { preciseCommify } from '@app/util/misc';
import { useState } from 'react';
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS } from '@app/util/dbr-auction';
import { DOLA_SAVINGS_ADDRESS, SDOLA_HELPER_ADDRESS } from '@app/util/dola-staking';
import { DbrAuctionType } from '@app/types';

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
  const [selectedAuction, setSelectedAuction] = useState<DbrAuctionType>('sdola');
  const { isLoading, accountEvents, events, nbBuys, accDolaIn, accDbrOut, avgDbrPrice } = useDbrAuctionBuys(account);
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - DBR auction</title>
        <meta name="og:title" content="Inverse Finance - DBR auction" />
        <meta name="og:description" content="DBR auction" />
        <meta name="description" content="DBR auction" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR, auction" />
      </Head>
      <AppNav active="Swap" />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
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
            <DbrAuctionBuyer helperAddress={AUCTION_TYPES[selectedAuction].helper} />
          </VStack>
          <Stack alignItems="flex-end" w={{ base: 'full', lg: '45%' }}>
            <DbrAuctionInfos type={selectedAuction} />
          </Stack>
        </Stack>
        <DbrAuctionBuys events={accountEvents} />
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
              {/* <VStack spacing="0" alignItems={{ base: 'flex-start', sm: 'center' }}>
                <Text fontWeight="bold">Number of buys</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text color="secondaryTextColor" fontWeight="bold" fontSize="18px">{commify(nbBuys)}</Text>
                }
              </VStack> */}
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">Total DOLA income</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(accDolaIn, 2)}</Text>
                }
              </VStack>
              <VStack spacing="0" alignItems="center">
                <Text textAlign="center" fontWeight="bold">Total DOLA income</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="center" color="secondaryTextColor" fontWeight="bold" fontSize="18px">{preciseCommify(accDbrOut, 2)}</Text>
                }
              </VStack>
              <VStack spacing="0" alignItems="flex-end">
                <Text textAlign="right" fontWeight="bold">Avg DBR price</Text>
                {
                  isLoading ? <SmallTextLoader width={'50px'} />
                    : <Text textAlign="right" color="secondaryTextColor" fontWeight="bold" fontSize="18px">{shortenNumber(avgDbrPrice, 5)}</Text>
                }
              </VStack>
            </HStack>
          }
        >
          <DbrAuctionBuysChart events={events} />
        </Container>
      </VStack>
    </Layout>
  )
}

export default DbrAuctionPage