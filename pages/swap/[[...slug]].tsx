import { Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { InfoMessage } from '@app/components/common/Messages';
import { SwapViewSocket } from '@app/components/ThirdParties/SwapViewSocket';
import Link from '@app/components/common/Link';

const supportedTokens = ['DOLA', 'DAI', 'USDC', 'USDT'];
type Params = { slug: string[] }

const possiblePaths: { params: Params }[] = []

for (let token of supportedTokens) {
  for (let otherToken of supportedTokens.filter(t => t !== token)) {
    possiblePaths.push({ params: { slug: [token, otherToken] } })
  }
}

export async function getStaticPaths() {
  if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
    return { paths: [], fallback: true }
  }
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
  if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
    return <Text>Network not supported</Text>
  }
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
      <Stack
        w={{ base: 'full', lg: '1000px' }}
        justify="center"
        direction={{ base: 'column', xl: 'row' }}
        mt='6'
        alignItems="flex-start"
        spacing="8"
      >
        <VStack w={{ base: 'full', lg: '60%' }}>
          <SwapViewSocket from={from} to={to} />
        </VStack>
        <Stack w={{ base: 'full', lg: '40%' }} direction="column" justifyContent="space-between">
          <InfoMessage
            showIcon={false}
            alertProps={{ fontSize: '12px', mb: '8' }}
            description={
              <Stack>
                <Text fontSize="14px" fontWeight="bold">What is DOLA?</Text>
                <Text mt="">
                  DOLA is Inverse Finance's decentralized <b>stablecoin</b>, the best way to get DOLA is to borrow it on FiRM!
                </Text>
                <Text fontSize="14px" fontWeight="bold">What is INV?</Text>
                <Text mt="">
                  INV is Inverse Finance's Governance token, allowing you to <b>vote on proposals</b> and <b>earn Real Yield</b> when staking it on FiRM.
                </Text>
                <Link href="/firm/INV" textDecoration="underline">
                  Stake INV on FiRM
                </Link>
                <Text fontSize="14px" fontWeight="bold">What is DBR?</Text>
                <Text mt="">
                  DBR is a borrowing right token, it <b>allows you to borrow DOLA on FiRM</b>, it's also the reward token for INV stakers.
                  You can buy it to borrow now or later, or <b>sell it when borrowing interest rates are high</b>.
                </Text>
                <Text fontSize="14px" fontWeight="bold">FiRM</Text>
                <Text mt="">
                  FiRM is our <b>Fixed-Rate Market</b> and it's where the <b>synergy between DOLA, INV & DBR</b> happens as <b>DBR rewards to INV stakers increases when borrowing demand for DOLA increases</b>!
                </Text>
                <Link href="/firm" textDecoration="underline">
                  Go to FiRM
                </Link>
              </Stack>
            }
          />
        </Stack>
      </Stack>
    </Layout>
  )
}

export default Swap