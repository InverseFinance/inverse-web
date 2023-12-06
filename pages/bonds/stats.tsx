import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { BondsStatsView } from '@app/components/Bonds/BondsStatsView';
import { BondsTabs } from '@app/components/BondsV2/BondsTabs';

export const BondsPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Bonds Stats</title>
                <meta name="og:title" content="Inverse Finance - Bonds" />
                <meta name="og:description" content="Inverse Finance's Bonds stats" />
                <meta name="description" content="Inverse Finance's Bonds stats" />
                <meta name="keywords" content="Inverse Finance, inv, token, DeFi, bonds, discount, olympus, ohm" />
            </Head>
            <AppNav active="Bonds" activeSubmenu="Bonds Stats" />
            <Flex direction="column" w={{ base: 'full' }} pt={{ sm: '4' }} maxWidth="1200px">
                <BondsTabs defaultIndex={2} />
                <BondsStatsView />
            </Flex>
        </Layout>
    )
}

export default BondsPage
