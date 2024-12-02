import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { OppysV2 } from '@app/components/common/Oppys/OppysV2';

export const OpportunitiesPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Yield Opportunities</title>
                <meta name="og:title" content="Inverse Finance - Yield Opportunities" />
                <meta name="og:description" content="INV & DOLA Yield Opportunities" />
                <meta name="description" content="INV & DOLA Yield Opportunities" />
                <meta name="keywords" content="Inverse Finance, inv, dola, DeFi, yield, earn" />
            </Head>
            <AppNav active="More" activeSubmenu="Yield Opportunities" />
            <Flex direction="column" w={{ base: 'full' }} pt='8' maxWidth="1200px">
                <OppysV2 />
            </Flex>
        </Layout>
    )
}

export default OpportunitiesPage
