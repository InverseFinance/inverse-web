import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { DbrAuctionBuyer } from '@app/components/F2/DbrAuction/DbrAuctionBuyer';
import { DbrAuctionInfos } from '@app/components/F2/DbrAuction/DbrAuctionInfos';
import { DbrAuctionBuys, useDbrAuctionBuys } from '@app/components/F2/DbrAuction/DbrAuctionBuys';
import { DbrAuctionBuysChart } from '@app/components/F2/DbrAuction/DbrAuctionBuysChart';
import { useAccount } from '@app/hooks/misc';
import Container from '@app/components/common/Container';

export const DbrAuctionPage = () => {
  const account = useAccount();
  const { accountEvents, events } = useDbrAuctionBuys(account);
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
            <DbrAuctionBuyer />
          </VStack>
          <Stack alignItems="flex-end" w={{ base: 'full', lg: '45%' }}>
            <DbrAuctionInfos />
          </Stack>
        </Stack>
        <DbrAuctionBuys events={accountEvents} />        
        <Container label="DBR auction stats" noPadding m="0" p="0">
          <DbrAuctionBuysChart events={events} />
        </Container>
      </VStack>
    </Layout>
  )
}

export default DbrAuctionPage