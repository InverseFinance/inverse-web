
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { EligibleRefunds } from '@app/components/Governance/Refunds/EligibleRefunds';
import { InfoMessage } from '@app/components/common/Messages';

export const GovRefunds = () => {

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Refunds</title>
        <meta name="og:title" content="Inverse Finance - Refunds" />
        <meta name="og:description" content="Refunds Portal" />
      </Head>
      <AppNav active="Participate" />

      <InfoMessage
        alertProps={{ mt: '2' }}
        title="TWG or TWG members only"
        description="Send refunds with TWG multisig and add/remove/resolve txs with a TWG member wallet" />

      <EligibleRefunds />
    </Layout>
  )
}

export default GovRefunds
