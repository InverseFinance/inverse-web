import { Stack, Text, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { InfoMessage } from '@app/components/common/Messages';
import Link from '@app/components/common/Link';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { DbrAuctionBuyer } from '@app/components/F2/DbrAuctionBuyer';

export const DbrAuctionPage = () => {
  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - DBR auction</title>
        <meta name="og:title" content="Inverse Finance - DBR auction" />
        <meta name="og:description" content="DBR auction" />
        <meta name="description" content="DBR auction" />
        <meta name="keywords" content="Inverse Finance, swap, stablecoin, DOLA, DBR, auction" />
      </Head>
      <AppNav active="Swap" />
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
          <DbrAuctionBuyer />
        </VStack>
        <Stack w={{ base: 'full', lg: '45%' }} direction="column" justifyContent="space-between">
          <InfoMessage
            showIcon={false}
            alertProps={{ fontSize: '12px', mb: '8' }}
            description={
              <Stack>
                <Text fontSize="14px" fontWeight="bold">What is DBR?</Text>
                <Text>
                  DBR is the DOLA Borrowing Right token, <b>1 DBR allows to borrow 1 DOLA for one year</b>, it's also the reward token for INV stakers on FiRM. Buy it to borrow or speculate on interest rates!
                </Text>
                <Link textDecoration="underline" href='https://docs.inverse.finance/inverse-finance/inverse-finance/product-guide/tokens/dbr' isExternal target="_blank">
                  Learn more about DBR <ExternalLinkIcon />
                </Link>
                <Text fontSize="14px" fontWeight="bold">What is DOLA?</Text>
                <Text>
                  DOLA is Inverse Finance's decentralized <b>stablecoin</b>, the best way to get DOLA is to borrow it on FiRM!
                </Text>
                <Link href="/tokens/yield-opportunities" textDecoration="underline">
                  See yield opportunities for DOLA
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

export default DbrAuctionPage