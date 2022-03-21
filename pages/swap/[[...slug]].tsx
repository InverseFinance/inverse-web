import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import { StabilizerOverview } from '@app/components/Stabilizer/Overview';
import { SwapView } from '@app/components/Swap'
import Head from 'next/head';
import Container from '@app/components/common/Container';

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
      </Head>
      <AppNav active="Swap" />
      <Flex justify="center" direction="column">
        <Flex w={{ base: 'full', xl: '2xl' }}>
          <SwapView from={from} to={to} />
        </Flex>
        <Flex w={{ base: 'full', xl: '2xl' }}>
          <Container
            label="Swap INV using Sushi"
            description="Open on Sushi"
            href="https://app.sushi.com/swap?inputCurrency=0x865377367054516e17014CcdED1e7d814EDC9ce4&outputCurrency=0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68"
          >
            <iframe
              src="https://app.sushi.com/swap?inputCurrency=0x865377367054516e17014CcdED1e7d814EDC9ce4&outputCurrency=0x41D5D79431A913C4aE7d69a668ecdfE5fF9DFB68"
              height="560px"
              width="100%"
              style={{
                border: '0',
                margin: '0 auto',
                display: 'block',
                borderRadius: '10px',
                maxWidth: '600px',
                minWidth: '300px',
                overflow: 'hidden',
              }}
            />
          </Container>
        </Flex>
        <Flex w={{ base: 'full', lg: '2xl' }} p={6}>
          <StabilizerOverview />
        </Flex>
      </Flex>
    </Layout>
  )
}

export default Swap
