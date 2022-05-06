import { Flex, Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { StabilizerOverview } from '@app/components/Stabilizer/Overview';
import { SwapView } from '@app/components/Swap'
import Head from 'next/head';
import { InfoMessage } from '@app/components/common/Messages';

const supportedTokens = ['DOLA', 'DAI', 'USDC', 'USDT'];
type Params = { slug: string[] }

const possiblePaths: { params: Params }[] = []

for (let token of supportedTokens) {
  for (let otherToken of supportedTokens.filter(t => t !== token)) {
    possiblePaths.push({ params: { slug: [token, otherToken] } })
  }
}

export async function getStaticPaths() {
  return {
    paths: possiblePaths,
    fallback: true,
  };
}

export async function getStaticProps({ params }: { params: Params }) {
  const { slug } = params;
  const from = slug?.length > 0 ? slug[0] : ''
  const to = slug?.length > 1 ? slug[1] : ''

  return {
    props: {
      from: from,
      to: to,
    },
  }
}

export const Swap = ({ from, to }: { from?: string, to?: string }) => {
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Swap</title>
        <meta name="og:title" content="Inverse Finance - Swap" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/swap.png" />
        <meta name="og:description" content="Swap between DOLA and other stablecoins with the best rates" />
        <meta name="description" content="Swap between DOLA and other stablecoins with the best rates" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DAI, USDT, USDC, best rate" />
      </Head>
      <AppNav active="Swap" />
      <Flex
        maxW={{ base: 'full', lg: '650px', xl: 'none' }}
        justify="center"
        direction={{ base: 'column', xl: 'row' }}
        alignItems={{ base: 'center', xl: 'flex-end' }}>
        <Flex w={{ base: 'full' }}>
          <SwapView from={from} to={to} />
        </Flex>
        <Flex direction="column" w={{ base: 'full', xl: '500px' }} mt={{ base: '4', xl: '0' }} p={{ base: '6', xl: '0' }} alignItems="flex-end">
          <InfoMessage
            alertProps={{ fontSize: '12px', mb: '4' }}
            description={
              <Stack>
                <Text fontSize="14px" fontWeight="bold">What is DOLA?</Text>
                <Text mt="">
                  DOLA is a <b>capital-efficient decentralized debt-backed stablecoin</b> on Ethereum and Fantom, 
                  every single DOLA in circulation is backed by collateral worth a higher value making it what is called an over-collateralized stablecoin.
                </Text>
              </Stack>
            }
          />
          <StabilizerOverview />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Swap
