import { Flex, Text, VStack } from '@chakra-ui/react'

import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs';
import { InvChart } from '@app/components/Transparency/InvChart'

export const InvTokenomics = () => {
 
  return (
    <Layout>
      <Head>
        <title>Inverse Finance - Transparency Overview</title>
        <meta name="og:title" content="Inverse Finance - Transparency" />
        <meta name="og:description" content="INV Governance Token" />
        <meta name="og:image" content="https://inverse.finance/assets/social-previews/transparency-inv.png" />
        <meta name="description" content="INV Governance Token Details" />
        <meta name="keywords" content="Inverse Finance, dao, transparency, inv, supply, xinv" />
      </Head>
      <AppNav active="Transparency" activeSubmenu="INV" hideAnnouncement={true} />
      <TransparencyTabs active="inv" />
      <Flex w="full" justify="center" direction={{ base: 'column', xl: 'row' }}>
        <InvChart />
      </Flex>
    </Layout>
  )
}

export default InvTokenomics
