import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { BondsStatsView } from '@app/components/Bonds/BondsStatsVIew';

export const BondsPage = () => {
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Bonds Stats</title>
                <meta name="og:title" content="Inverse Finance - Bonds" />
                <meta name="og:description" content="Buy INV at a discount thanks to bonds" />
                <meta name="description" content="Buy INV at a discount thanks to bonds" />
                <meta name="keywords" content="Inverse Finance, inv, token, DeFi, bonds, discount, olympus, ohm" />
            </Head>
            <AppNav active="Bonds" />
            <Flex direction="column" w={{ base: 'full' }} pt='8' maxWidth="1200px">
                <BondsStatsView />
            </Flex>
        </Layout>
    )
}

export default BondsPage
