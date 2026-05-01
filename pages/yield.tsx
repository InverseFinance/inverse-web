import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { Oppys } from '@app/components/common/Oppys';

export const EarnPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Yield Opportunities</title>
                <meta name="og:title" content="Inverse Finance - Yield Opportunities" />
                <meta name="og:description" content="Explore DeFi yield opportunities with DOLA and INV tokens on Inverse Finance. Earn real yield through fixed-rate lending, liquidity provision, and staking." />
                <meta name="description" content="Explore DeFi yield opportunities with DOLA and INV tokens on Inverse Finance. Earn real yield through fixed-rate lending, liquidity provision, and staking." />
                <meta name="keywords" content="Inverse Finance, yield, DeFi, DOLA, INV, staking, liquidity, fixed-rate, sDOLA" />
            </Head>
            <AppNav active="Earn" activeSubmenu="Yield Opportunities" />
            <Flex direction="column" w={{ base: 'full' }} pt='8' maxWidth="1100px">
                <Oppys />
            </Flex>
        </Layout>
    )
}

export default EarnPage
