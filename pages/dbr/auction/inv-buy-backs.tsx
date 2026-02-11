import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useAccount } from '@app/hooks/misc';

export const InvBuyBacksPage = () => {
  const account = useAccount();  
  
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
        spacing="8"
        px={{ base: '4', lg: '0' }}
      >
        <VStack spacing="4">
          <Stack
            spacing={{ base: '2', xl: '0' }}
            alignItems="space-between"
            justify="space-between"
            w='full'
            direction={{ base: 'column', xl: 'row' }}
          >
            <VStack alignItems="flex-start" w={{ base: 'full', lg: '65%' }}>
              
            </VStack>
            <Stack alignItems="flex-end" w={{ base: 'full', lg: '35%' }}>
              
            </Stack>
          </Stack>
        </VStack>
      </VStack>
    </Layout>
  )
}

export default InvBuyBacksPage