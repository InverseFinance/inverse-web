import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { BondsView } from '@app/components/Bonds/BondsView';

export const BondsPage = () => {
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - INV</title>
                <meta name="og:title" content="Inverse Finance - Bonds" />
                <meta name="og:description" content="Buy INV at a discount thanks to bonds" />
                <meta name="description" content="Buy INV at a discount thanks to bonds" />
                <meta name="keywords" content="Inverse Finance, inv, token, DeFi, bonds, discount, olympus, ohm" />
            </Head>
            <AppNav active="Bonds" />
            <Flex direction="column" w={{ base: 'full' }} pt={{ sm: '4' }} maxWidth="900px">
                <BondsView />
            </Flex>
        </Layout>
    )
}

export default BondsPage
