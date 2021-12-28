import { Flex } from '@chakra-ui/react'
import Layout from '@inverse/components/common/Layout'
import { AppNav } from '@inverse/components/common/Navbar'
import { StabilizerOverview } from '@inverse/components/Stabilizer/Overview';
import { SwapView } from '@inverse/components/Swap'
import Head from 'next/head';

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
        <title>Inverse Finance - Swap</title>
      </Head>
      <AppNav active="Swap" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: '2xl' }}>
          <SwapView from={from} to={to} />
        </Flex>
        <Flex w={{ base: 'full', lg: '2xl' }}>
          <StabilizerOverview />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Swap
