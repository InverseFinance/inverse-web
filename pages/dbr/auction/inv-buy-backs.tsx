import { Box, HStack, Image, Stack, Text, VStack, VStack as ChakraVStack, SimpleGrid } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useAccount } from '@app/hooks/misc';
import { InvBuyBackUI } from '@app/components/F2/DbrAuction/InvBuyBackUI';
import { InfoMessage } from '@app/components/common/Messages';
import { useCustomSWR } from '@app/hooks/useCustomSWR';
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import Container from '@app/components/common/Container';
import Table from '@app/components/common/Table';
import ScannerLink from '@app/components/common/ScannerLink';
import { Timestamp } from '@app/components/common/BlockTimestamp/Timestamp';
import { INV_BUY_BACK_AUCTION } from '@app/config/constants';
import { useDBRPrice, useDBRMarkets } from '@app/hooks/useDBR';
import { StringCard } from '@app/components/F2/UserDashboard';
import { timeSince } from '@app/util/time';

export const InvBuyBacksPage = () => {
  const { priceUsd: dbrPriceUsd } = useDBRPrice();
  const { data, isLoading } = useCustomSWR('/api/auctions/inv-buy-backs');
  const { markets, isLoading: isLoadingMarkets } = useDBRMarkets();
  const invMarket = markets?.find(m => m.isInv);
  const invPrice = invMarket?.price || 0;

  const invReserve = data?.invReserve || 0;
  const dbrReserve = data?.dbrReserve || 0;
  const dbrRatePerYear = data?.dbrRatePerYear || 0;
  const maxDbrRatePerYear = data?.maxDbrRatePerYear || 0;
  const minDbrRatePerYear = data?.minDbrRatePerYear || 0;
  const totalInvIn = data?.totalInvIn || 0;
  const totalInvInWorth = totalInvIn * invPrice; //data?.totalInvInWorth || 0;
  const last100Buys = (data?.last100Buys || []).slice().sort((a: any, b: any) => b.timestamp - a.timestamp);

  // Calculate average hourly rate from last100Buys
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const last24hBuys = last100Buys.filter((buy: any) => buy.timestamp >= oneDayAgo);
  const last24hInvIn = last24hBuys.reduce((sum: number, buy: any) => sum + (buy.invIn || 0), 0);
  const last24hInvInWorth = last24hInvIn * invPrice;

  // Calculate average hourly rate
  let avgHourlyRate = 0;
  if (last100Buys.length > 1) {
    const oldestBuy = last100Buys[last100Buys.length - 1];
    const newestBuy = last100Buys[0];
    const timeSpanHours = (newestBuy.timestamp - oldestBuy.timestamp) / (1000 * 60 * 60);
    if (timeSpanHours > 0) {
      avgHourlyRate = last100Buys.reduce((prev, curr) => prev + (curr.invIn || 0), 0) / timeSpanHours;
    }
  }

  const estimatedMonthlyBuyPressure = (dbrRatePerYear * dbrPriceUsd) / 12;

  const buyColumns: any[] = [
    {
      field: 'txHash',
      label: 'Tx',
      header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="120px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ txHash }: any) => (
        <HStack justify="flex-start" minWidth="120px" fontSize="14px">
          <ScannerLink value={txHash} type="tx" />
        </HStack>
      ),
    },
    {
      field: 'timestamp',
      label: 'Date',
      header: ({ ...props }: any) => <HStack justify="flex-start" minWidth="140px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ timestamp }: any) => (
        <HStack minWidth="140px" fontSize="14px">
          <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
        </HStack>
      ),
    },
    {
      field: 'invIn',
      label: 'INV In',
      header: ({ ...props }: any) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ invIn }: any) => (
        <HStack justify="center" minWidth="100px" fontSize="14px">
          <Text fontWeight="bold">{shortenNumber(invIn, 4)}</Text>
        </HStack>
      ),
    },
    {
      field: 'dbrOut',
      label: 'DBR Out',
      header: ({ ...props }: any) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ dbrOut }: any) => (
        <HStack justify="center" minWidth="100px" fontSize="14px">
          <Text fontWeight="bold">{shortenNumber(dbrOut, 4)}</Text>
        </HStack>
      ),
    },
  ];

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - INV buyback</title>
        <meta name="og:title" content="Inverse Finance - INV buyback" />
        <meta name="og:description" content="INV buyback" />
        <meta name="description" content="INV buyback" />
        <meta name="keywords" content="Inverse Finance, DBR, INV buyback, INV" />
      </Head>
      <AppNav active="Stake" activeSubmenu="INV buyback" />
      <VStack
        w={{ base: 'full', lg: '1200px' }}
        mt='6'
        spacing="10"
        px={{ base: '4', lg: '0' }}
      >
        {/* Hero / marketing section */}
        <HStack
          w="full"
          alignItems="center"
          spacing={{ base: 4, md: 8 }}
          flexDirection={{ base: 'column', md: 'row' }}
        >
          <HStack spacing={4}>
            <Box position="relative">
              <Image
                src="/assets/inv-square-dark.jpeg"
                alt="INV"
                boxSize={{ base: '60px', md: '72px' }}
                borderRadius="full"
                boxShadow="0 0 16px rgba(0,0,0,0.4)"
              />
              <Image
                src="/assets/v2/dbr.webp"
                alt="DBR"
                boxSize={{ base: '44px', md: '52px' }}
                borderRadius="full"
                position="absolute"
                bottom={-3}
                right={-3}
                boxShadow="0 0 16px rgba(0,0,0,0.4)"
              />
            </Box>
          </HStack>
          <VStack alignItems="flex-start" spacing={2} flex="1">
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="extrabold">
              INV buyback automated program
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="secondaryTextColor">
              An automated program that buys back INV from the market using DBR auction flows, removing INV from circulation and sending it back to the Inverse Finance treasury, this creates buying pressure on INV and selling pressure on DBR.
            </Text>
            <HStack spacing={6} pt={2} flexWrap="wrap" rowGap={4} w='full'>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={{ base: 2, md: 4 }} w='full'>
                <StringCard
                  valueProps={{ fontSize: '18px' }} labelProps={{ fontSize: '13px' }}
                  value={isLoading ? '-' : `${shortenNumber(last24hInvIn, 2)} INV (~${smartShortNumber(last24hInvInWorth, 2, true)})`}
                  label="Last 24h buys"
                />
                <StringCard
                  valueProps={{ fontSize: '18px' }} labelProps={{ fontSize: '13px' }}
                  value={isLoading ? '-' : `${shortenNumber(totalInvIn, 2)} INV (~${smartShortNumber(totalInvInWorth, 2, true)})`}
                  label="Buybacks since Feb 16th 2026"
                />
                <StringCard
                  valueProps={{ fontSize: '18px' }} labelProps={{ fontSize: '13px' }}
                  value={isLoading || !invPrice ? '-' : `${shortenNumber(estimatedMonthlyBuyPressure / invPrice, 2)} INV (${smartShortNumber(estimatedMonthlyBuyPressure, 2, true)})`}
                  label="Est. monthly buying pressure"
                />
                <StringCard
                  valueProps={{ fontSize: '18px' }} labelProps={{ fontSize: '13px' }}
                  value={isLoading ? '-' : smartShortNumber(dbrRatePerYear * dbrPriceUsd, 2, true)}
                  label="Yearly DBR budget"
                />
              </SimpleGrid>

              {/* <VStack alignItems="flex-start" spacing={0}>
                <Text fontSize="12px" color="secondaryTextColor">
                  Last 24h buys
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {isLoading ? '-' : `${shortenNumber(last24hInvIn, 2)} INV (~${smartShortNumber(last24hInvInWorth, 2, true)})`}
                </Text>
              </VStack> */}
              {/* <VStack alignItems="flex-start" spacing={0}>
                <Text fontSize="12px" color="secondaryTextColor">
                  Total INV bought back since Feb 16th 2026
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {isLoading ? '-' : `${shortenNumber(totalInvIn, 2)} INV (~${smartShortNumber(totalInvInWorth, 2, true)})`}
                </Text>
              </VStack>
              <VStack alignItems="flex-start" spacing={0}>
                <Text fontSize="12px" color="secondaryTextColor">
                  Avg. buy pace (based on last 100 buys)
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {isLoading || last100Buys.length === 0 ? '-' : `${shortenNumber(avgHourlyRate * 24 * 30, 2)} INV/month`}
                </Text>
              </VStack>

              <VStack alignItems="flex-start" spacing={0}>
                <Text fontSize="12px" color="secondaryTextColor">
                  Yearly DBR budget for buybacks
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {isLoading ? '-' : smartShortNumber(dbrRatePerYear * dbrPriceUsd, 2, true)}
                </Text>
              </VStack> */}
            </HStack>
          </VStack>
        </HStack>

        <Container
          label="Last 100 INV buybacks"
          description={last100Buys.length > 0 ? `Last update: ${timeSince(data?.timestamp)}` : 'Loading...'}
          w="full"
          contentProps={{ p: 0, overflowX: 'auto' }}
          noPadding
          p="0"
          collapsable={true}
        >
          <VStack w="full" alignItems="flex-start" p={4} spacing={4}>
            <Table
              keyName="txHash"
              noDataMessage="No buys yet"
              columns={buyColumns}
              items={last100Buys}
              defaultSort="timestamp"
              defaultSortDir="desc"
            />
          </VStack>
        </Container>

        <VStack spacing="4" w='full'>
          <Stack
            spacing={{ base: '2', xl: '0' }}
            alignItems="flex-end"
            justify="space-between"
            w='full'
            direction={{ base: 'column', xl: 'row' }}
          >
            <VStack alignItems="flex-start" w={{ base: 'full', lg: '65%' }}>
              <InvBuyBackUI />
            </VStack>
            <Stack alignItems="flex-end" w={{ base: 'full', lg: '35%' }}>
              <Container noPadding p="0"
                label="INV buyback Auction contract"
                description="See on Etherscan"
                href={`https://etherscan.io/address/${INV_BUY_BACK_AUCTION}`}
              >
                <InfoMessage
                  alertProps={{ w: 'full' }}
                  title="INV buyback Program"
                  description={
                    <ChakraVStack alignItems="flex-start" spacing={1}>
                      <Text fontWeight="bold" pt={2}>
                        Auction reserves
                      </Text>
                      <Text fontSize="14px">
                        INV reserve:{' '}
                        <b>
                          {isLoading ? '-' : `${smartShortNumber(invReserve, 2)} (${smartShortNumber(invReserve * invPrice, 2, true)})`}
                        </b>
                      </Text>
                      <Text fontSize="14px">
                        DBR reserve:{' '}
                        <b>
                          {isLoading ? '-' : `${smartShortNumber(dbrReserve, 2)} (${smartShortNumber(dbrReserve * dbrPriceUsd, 2, true)})`}
                        </b>
                      </Text>
                      <Text fontWeight="bold" pt={2}>
                        DBR emission parameters
                      </Text>
                      <Text fontSize="14px">
                        Current DBR rate per year:{' '}
                        <b>
                          {isLoading
                            ? '-'
                            : `${smartShortNumber(dbrRatePerYear, 2)} (${smartShortNumber(dbrRatePerYear * dbrPriceUsd, 2, true)})`}
                        </b>
                      </Text>
                      <Text fontSize="14px">
                        Min DBR rate per year:{' '}
                        <b>
                          {isLoading
                            ? '-'
                            : `${smartShortNumber(minDbrRatePerYear, 2)} (${smartShortNumber(minDbrRatePerYear * dbrPriceUsd, 2, true)})`}
                        </b>
                      </Text>
                      <Text fontSize="14px">
                        Max DBR rate per year:{' '}
                        <b>
                          {isLoading
                            ? '-'
                            : `${smartShortNumber(maxDbrRatePerYear, 2)} (${smartShortNumber(maxDbrRatePerYear * dbrPriceUsd, 2, true)})`}
                        </b>
                      </Text>
                    </ChakraVStack>
                  }
                />
              </Container>
            </Stack>
          </Stack>
        </VStack>
      </VStack>
    </Layout>
  )
}

export default InvBuyBacksPage