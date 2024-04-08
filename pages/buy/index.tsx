import { Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { InfoMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { useWeb3React } from '@web3-react/core';

export const Stably = () => {
  const { account } = useWeb3React();

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - On-ramp / Off-ramp</title>
        <meta name="og:title" content="Inverse Finance - On-ramp / Off-ramp" />
        <meta name="og:description" content="On-ramp / Off-ramp" />
        <meta name="description" content="On-ramp / Off-ramp" />
        <meta name="keywords" content="Inverse Finance, On-ramp / Off-ramp, stablecoin, DOLA, DAI, USDT, USDC, INV, DBR" />
      </Head>
      <AppNav active="More" activeSubmenu="On-ramp / Off-ramp" />
      <Stack
        w={{ base: 'full', lg: '1000px' }}
        justify="center"
        direction={{ base: 'column', xl: 'row' }}
        mt='6'
        alignItems="flex-start"
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <VStack w='full' spacing='4'>
          <InfoMessage alertProps={{ w: '420px' }} description={<VStack alignItems="flex-start">
            <Text>On-ramp/off-ramp with Stably</Text>
            <Link textDecoration="underline" href="https://stably.io/" target="_blank">
              Learn more about this third-party service <ExternalLinkIcon />
            </Link>
          </VStack>} />
          <iframe src={`https://ramp.stably.io/?integrationId=inverse-5d0b7f79&fromNetworks=credit_debit_card&toAddress=${account}&amount=100&toNetworks=ethereum,base,optimism,arbitrum&network=icon&asset=USDS&filter=true`} height="680" width="420" />
        </VStack>
      </Stack>
    </Layout>
  )
}

export default Stably