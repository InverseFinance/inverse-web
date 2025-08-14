import { Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { InfoMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import EnsoZap from '@app/components/ThirdParties/enso/EnsoZap';
import { ZAP_TOKENS_ARRAY } from '@app/components/ThirdParties/tokenlist';

export const Swap = () => {
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Swap</title>
        <meta name="og:title" content="Inverse Finance - Swap" />
        <meta name="og:description" content="Swap between popular assets within the Inverse ecosystem" />
        <meta name="description" content="Swap between popular assets within the Inverse ecosystem" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DAI, USDT, USDC, INV, DBR" />
      </Head>
      <AppNav active="More" activeSubmenu="Swap" />
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
          <InfoMessage
            alertProps={{ w: 'full' }}
            title="Note on Crypto assets"
            description={
              <VStack w='full' alignItems='flex-start'>
                <Text>Don't invest unless you're prepared to lose all the money you invest.</Text>
                <Text>Crypto assets are high-risk investments and you should not expect to be protected if something goes wrong. Take time to learn more before investing in a crypto asset.</Text>
              </VStack>
            } />
            <EnsoZap
              // defaultTokenIn={fromToken as string}
              // defaultTokenOut={toToken as string}
              defaultTargetChainId={'1'}
              title="Swap between popular assets"
              containerProps={{ w: 'full' }}
              isSingleChoice={true}
              asSwapUi={true}
              ensoPools={
                ZAP_TOKENS_ARRAY.filter(token => token.chainId === 1).map(token => {
                  return { poolAddress: token.address, ...token, chainId: token.chainId }
                })
              }
            />
          {/* <SwapViewSocket fromToken={fromToken} toToken={toToken} fromChain={fromChain} toChain={toChain} /> */}
          {/* <InfoMessage alertProps={{ w: 'full' }} description={
            <VStack w='full' alignItems='flex-start'>
              <Text>Socket is a third-party service</Text>
            </VStack>
          } /> */}
        </VStack>
        <Stack w={{ base: 'full', lg: '45%' }} direction="column" justifyContent="space-between">
          <InfoMessage
            showIcon={false}
            alertProps={{ fontSize: '12px', mb: '8' }}
            description={
              <Stack>
                <Text fontSize="14px" fontWeight="bold">About the swap routing</Text>
                <Text>
                  Our swap component is powered by Socket.tech which works as an aggregator.
                </Text>
                <Link isExternal target="_blank" href="https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dola" textDecoration="underline">
                  Learn more about bridges & risk in the bridge tab in our docs <ExternalLinkIcon />
                </Link>
                <Text fontSize="14px" fontWeight="bold">What is DOLA?</Text>
                <Text>
                  DOLA is Inverse Finance's decentralized <b>stablecoin</b>, the best way to get DOLA is to borrow it on FiRM!
                </Text>
                <Link href="/tokens/yield-opportunities" textDecoration="underline">
                  See yield opportunities for DOLA
                </Link>
                <Text fontSize="14px" fontWeight="bold">What is INV?</Text>
                <Text>
                  INV is Inverse Finance's Governance token, allowing you to <b>vote on proposals</b> and <b>earn Real Yield</b> via DBR issuance when staking on FiRM.
                </Text>
                <Link href="/firm/INV" textDecoration="underline">
                  Stake INV on FiRM
                </Link>
                <Text fontSize="14px" fontWeight="bold">What is DBR?</Text>
                <Text>
                  DBR is the DOLA Borrowing Right token, <b>1 DBR allows to borrow 1 DOLA for one year</b>, it's also the reward token for INV stakers on FiRM. Buy it to borrow or speculate on interest rates!
                </Text>
                <Link textDecoration="underline" href='https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr' isExternal target="_blank">
                  Learn more about DBR <ExternalLinkIcon />
                </Link>
                <Text fontSize="14px" fontWeight="bold">Token Synergy on FiRM</Text>
                <Text>
                  FiRM is our <b>Fixed-Rate Market</b> and it's where the <b>synergy between DOLA, INV & DBR</b> happens! <b>DBR rewards to INV stakers increases when borrowing demand for DOLA increases</b>!
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