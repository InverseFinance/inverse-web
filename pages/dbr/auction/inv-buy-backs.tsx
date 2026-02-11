import { Stack, VStack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { useAccount } from '@app/hooks/misc';
import { InvBuyBackUI } from '@app/components/F2/DbrAuction/InvBuyBackUI';
import { InfoMessage } from '@app/components/common/Messages';
import { Text, VStack as ChakraVStack } from '@chakra-ui/react';

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
              <InvBuyBackUI />
            </VStack>
            <Stack alignItems="flex-end" w={{ base: 'full', lg: '35%' }}>
              <InfoMessage
                alertProps={{ w: 'full' }}
                title="INV Buy Back Program"
                description={
                  <ChakraVStack alignItems="flex-start" spacing={1}>
                    <Text>
                      This DBR auction aims to buy back INV from market circulation in an automated way, each INV exchanged for DBR is removed from circulation and sent back to the Inverse Finance treasury, this creates buying pressure on INV and selling pressure on DBR.
                    </Text>
                  </ChakraVStack>
                }
              />
            </Stack>
          </Stack>
        </VStack>
      </VStack>
    </Layout>
  )
}

export default InvBuyBacksPage