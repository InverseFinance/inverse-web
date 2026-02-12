import { Box, HStack, Image, Stack, Text, VStack, VStack as ChakraVStack } from '@chakra-ui/react'
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

export const InvBuyBacksPage = () => {
  const account = useAccount();
  const { data, isLoading } = useCustomSWR('/api/auctions/inv-buy-backs');

  const invReserve = data?.invReserve || 0;
  const dbrReserve = data?.dbrReserve || 0;
  const dbrRatePerYear = data?.dbrRatePerYear || 0;
  const maxDbrRatePerYear = data?.maxDbrRatePerYear || 0;
  const minDbrRatePerYear = data?.minDbrRatePerYear || 0;
  const totalInvIn = data?.totalInvIn || 0;
  const last100Buys = (data?.last100Buys || []).slice().sort((a, b) => b.timestamp - a.timestamp);

  const buyColumns = [
    {
      field: 'txHash',
      label: 'Tx',
      header: ({ ...props }) => <HStack justify="flex-start" minWidth="120px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ txHash }) => (
        <HStack justify="flex-start" minWidth="120px" fontSize="14px">
          <ScannerLink value={txHash} type="tx" />
        </HStack>
      ),
    },
    {
      field: 'timestamp',
      label: 'Date',
      header: ({ ...props }) => <HStack justify="flex-start" minWidth="140px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ timestamp }) => (
        <HStack minWidth="140px" fontSize="14px">
          <Timestamp timestamp={timestamp} text1Props={{ fontSize: '12px' }} text2Props={{ fontSize: '12px' }} />
        </HStack>
      ),
    },
    {
      field: 'invIn',
      label: 'INV In',
      header: ({ ...props }) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ invIn }) => (
        <HStack justify="center" minWidth="100px" fontSize="14px">
          <Text fontWeight="bold">{shortenNumber(invIn, 4)}</Text>
        </HStack>
      ),
    },
    {
      field: 'dbrOut',
      label: 'DBR Out',
      header: ({ ...props }) => <HStack justify="center" minWidth="100px" fontSize="14px" fontWeight="extrabold" {...props} />,
      value: ({ dbrOut }) => (
        <HStack justify="center" minWidth="100px" fontSize="14px">
          <Text fontWeight="bold">{shortenNumber(dbrOut, 4)}</Text>
        </HStack>
      ),
    },
  ];

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - INV buy backs</title>
        <meta name="og:title" content="Inverse Finance - INV buy backs" />
        <meta name="og:description" content="INV buy backs" />
        <meta name="description" content="INV buy backs" />
        <meta name="keywords" content="Inverse Finance, DBR, INV buy backs, INV" />
      </Head>
      <AppNav active="Stake" activeSubmenu="INV buy backs" />
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
              INV Buy Back automated program
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="secondaryTextColor">
              An automated program that buys back INV from the market using DBR auction flows, removing INV from circulation and sending it back to the Inverse Finance treasury, this creates buying pressure on INV and selling pressure on DBR.
            </Text>
            <HStack spacing={6} pt={2}>
              <VStack alignItems="flex-start" spacing={0}>
                <Text fontSize="12px" color="secondaryTextColor">
                  Total INV bought back
                </Text>
                <Text fontSize="lg" fontWeight="bold">
                  {isLoading ? '-' : `${shortenNumber(totalInvIn, 4)} INV`}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </HStack>

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
              label="INV Buy Back Auction contract"
              description="See on Etherscan"
              href={`https://etherscan.io/address/${INV_BUY_BACK_AUCTION}`}
              >
                <InfoMessage
                  alertProps={{ w: 'full' }}
                  title="INV Buy Back Program"
                  description={
                    <ChakraVStack alignItems="flex-start" spacing={1}>
                      <Text fontWeight="bold" pt={2}>
                        Auction reserves
                      </Text>
                      <Text fontSize="14px">
                        INV reserve:{' '}
                        <b>
                          {isLoading ? '-' : `${smartShortNumber(invReserve, 2)} INV`}
                        </b>
                      </Text>
                      <Text fontSize="14px">
                        DBR reserve:{' '}
                        <b>
                          {isLoading ? '-' : `${smartShortNumber(dbrReserve, 2)} DBR`}
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
                            : `${shortenNumber(dbrRatePerYear, 2)} DBR / year`}
                        </b>
                      </Text>
                      <Text fontSize="14px">
                        Min DBR rate per year:{' '}
                        <b>
                          {isLoading
                            ? '-'
                            : `${shortenNumber(minDbrRatePerYear, 2)} DBR / year`}
                        </b>
                      </Text>
                      <Text fontSize="14px">
                        Max DBR rate per year:{' '}
                        <b>
                          {isLoading
                            ? '-'
                            : `${shortenNumber(maxDbrRatePerYear, 2)} DBR / year`}
                        </b>
                      </Text>
                    </ChakraVStack>
                  }
                />
              </Container>
            </Stack>
          </Stack>
        </VStack>

        <Container
          label="Latest INV Buy Backs"
          description="Last 100 buys executed by the program"
          w="full"
          contentProps={{ p: 0, overflowX: 'auto' }}
          noPadding
          p="0"
        >
          <VStack w="full" alignItems="flex-start" p={4} spacing={4}>
            <Text fontSize="14px" color="secondaryTextColor">
              Total INV bought back so far:{' '}
              <b>{isLoading ? '-' : `${shortenNumber(totalInvIn, 4)} INV`}</b>
            </Text>
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
      </VStack>
    </Layout>
  )
}

export default InvBuyBacksPage