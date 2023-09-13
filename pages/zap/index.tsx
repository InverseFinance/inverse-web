import { Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { InfoMessage } from '@app/components/common/Messages';
import { useRouter } from 'next/router';
import { ZapViewEnso } from '@app/components/ThirdParties/ZapViewEnso';

export const ZapPage = () => {
  const { query } = useRouter();
  const { fromToken, toToken, fromChain, toChain } = (query || {});

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Zap / Bridge</title>
        <meta name="og:title" content="Inverse Finance - Zap / Bridge" />
        <meta name="og:description" content="Zap and Bridge DOLA and other assets" />
        <meta name="description" content="Zap and Bridge DOLA and other assets" />
        <meta name="keywords" content="Inverse Finance, swap, bridge, stablecoin, DOLA, DAI, USDT, USDC, INV, DBR" />
      </Head>
      <AppNav active="Zap" />
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
          <ZapViewEnso fromToken={fromToken} toToken={toToken} fromChain={fromChain} toChain={toChain} />
          <InfoMessage alertProps={{ w: 'full' }} description="Enso is a third-party service" />
        </VStack>
        <Stack w={{ base: 'full', lg: '45%' }} direction="column" justifyContent="space-between">
          <InfoMessage
            showIcon={false}
            alertProps={{ fontSize: '12px', mb: '8' }}
            description={
              <Stack>
                <Text fontSize="14px" fontWeight="bold">
                  Zapping is provided by the third-party Enso
                </Text>
                <Text fontSize="14px" fontWeight="bold">
                  Perform your own due diligence.
                </Text>
              </Stack>
            }
          />
        </Stack>
      </Stack>
    </Layout>
  )
}

export default ZapPage