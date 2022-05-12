
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { EligibleRefunds } from '@app/components/Governance/Refunds/EligibleRefunds';

export const GovRefunds = () => {

  return (
    <Layout>
      <Head>
        <title>{process.env.NEXT_PUBLIC_TITLE} - Refunds</title>
        <meta name="og:title" content="Inverse Finance - Refunds" />
        <meta name="og:description" content="Refunds Portal" />
      </Head>
      <AppNav active="Governance" />
      <EligibleRefunds />
    </Layout>
  )
}

export default GovRefunds
