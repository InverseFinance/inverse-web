import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { Oppys } from '@app/components/common/Oppys';

export const EarnPage = () => {
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - Yield Opportunities</title>
                <meta name="og:title" content="Inverse Finance - Yield Opportunities" />
                <meta name="og:description" content="INV & DOLA Yield Opportunities" />
                <meta name="description" content="INV & DOLA Yield Opportunities" />
                <meta name="keywords" content="Inverse Finance, inv, dola, DeFi, yield, earn" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/alerts.jpeg" />
            </Head>
            <AppNav active="Earn" activeSubmenu="Yield Opportunities" />
            <Flex direction="column" w={{ base: 'full' }} pt='8' maxWidth="1100px">
                <Oppys />
            </Flex>
        </Layout>
    )
}

export default EarnPage
