import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { MultisigsDiagram } from '@app/components/Transparency/MultisigsDiagram'

export const MultisigsDiagramPage = () => {
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Multisigs</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="Multisigs" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-portal.png" />
        <meta name="description" content="Inverse Finance Multisigs" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, multisigs" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="Multisig Wallets" hideAnnouncement={true} />
      <TransparencyTabs active="multisigs" />
      <MultisigsDiagram />
    </Layout>
  )
}

export default MultisigsDiagramPage
