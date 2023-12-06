import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';

import { BondsTabs } from '@app/components/BondsV2/BondsTabs';
import { BondsPurchased } from '@app/components/BondsV2/BondsPurchased';

export const BondsPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Bonds</title>
                <meta name="og:title" content="Inverse Finance - Bonds" />
                <meta name="og:description" content="Buy INV at a discount thanks to bonds" />
                <meta name="description" content="Buy INV at a discount thanks to bonds" />
                <meta name="keywords" content="Inverse Finance, inv, token, DeFi, bonds, discount, olympus, ohm" />
            </Head>
            <AppNav active="Bonds" activeSubmenu="Bonds" />
            <Flex direction="column" w={{ base: 'full' }} pt={{ sm: '4' }} maxWidth="900px">
                <BondsTabs defaultIndex={1} />
                <BondsPurchased />
            </Flex>
        </Layout>
    )
}

export default BondsPage
