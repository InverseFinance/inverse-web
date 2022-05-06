import { Flex, Text, VStack } from '@chakra-ui/react'
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
      <Flex justify="center" direction={{ base: 'column', lg: 'row' }} alignItems="center">
        <Flex w={{ base: 'full', xl: '2xl' }}>
          <SwapView from={from} to={to} />
        </Flex>
        <Flex direction="column" w={{ base: 'full', lg: '500px' }} p={6}  alignItems="flex-end">
          <InfoMessage
            title="What is DOLA?"
            alertProps={{ fontSize: '12px', mb: '2' }}
            description={
              <>
                <Text>DOLA is fully-collaterized decentralized debt-backed stablecoin on Ethereum and Fantom</Text>
                <Text>This page is the place to get DOLA with cheap fees on Ethereum</Text>
              </>
            }
          />
          <StabilizerOverview />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Swap
