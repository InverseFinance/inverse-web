import { HStack, Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { InfoMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { DbrAuctionBuyer } from '@app/components/F2/DbrAuction/DbrAuctionBuyer';
import { DbrAuctionInfos } from '@app/components/F2/DbrAuction/DbrAuctionInfos';

export const DbrAuctionPage = () => {
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - DBR auction</title>
        <meta name="og:title" content="Inverse Finance - DBR auction" />
        <meta name="og:description" content="DBR auction" />
        <meta name="description" content="DBR auction" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR, auction" />
      </Head>
      <AppNav active="Swap" />
      <Stack
        w={{ base: 'full', lg: '1000px' }}
        justify="center"
        direction={{ base: 'column', xl: 'row' }}
        mt='6'
        alignItems="flex-start"
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <VStack w={{ base: 'full', lg: '55%' }}>
          <DbrAuctionBuyer />
        </VStack>
        <Stack w={{ base: 'full', lg: '45%' }} direction="column" justifyContent="space-between">
          <DbrAuctionInfos />
        </Stack>
      </Stack>
    </Layout>
  )
}

export default DbrAuctionPage