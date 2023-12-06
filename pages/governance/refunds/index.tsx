
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { EligibleRefunds } from '@app/components/Governance/Refunds/EligibleRefunds';
import { InfoMessage } from '@app/components/common/Messages';
import { HStack, VStack, Text } from '@chakra-ui/react';

export const GovRefunds = () => {

  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Refunds</title>
        <meta name="og:title" content="Inverse Finance - Refunds" />
        <meta name="og:description" content="Refunds Portal" />
      </Head>
      <AppNav active="Governance" />

      <HStack maxW="1000px" justify="center" alignItems="flex-start" mt="2">
        <InfoMessage
          alertProps={{ w: '100%' }}
          title="Eligible Refunds Data"
          description={<VStack alignItems="flex-start">
            <Text>Cron jobs for each filter & multisig run around every 3 hours, data freshness can be older due to failed cron jobs sometimes (third-party rate limits etc).</Text>
            <Text fontWeight="bold">Note: data freshness can be different per tx type & multisig, overall freshness should be below 24h.</Text>
            <Text fontWeight="bold">Refunds possible by TWG or TWG members only</Text>
          </VStack>
          }
        />
      </HStack>

      <EligibleRefunds />
    </Layout>
  )
}

export default GovRefunds
