import { Flex } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { OppysV2 } from '@app/components/common/Oppys/OppysV2';

export const OpportunitiesPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - DOLA Yield Opportunities</title>
                <meta name="og:title" content="Inverse Finance - DOLA Yield Opportunities" />
                <meta name="og:description" content="DOLA Yield Opportunities" />
                <meta name="description" content="DOLA Yield Opportunities" />
                <meta name="keywords" content="Inverse Finance, inv, dola, DeFi, yield, earn" />
            </Head>
            <AppNav active="More" activeSubmenu="DOLA Yield Opportunities" />
            <Flex overflow="hidden" direction="column" w={{ base: 'full' }} pt='8' maxWidth="800px">
                <OppysV2 showLinks={false} />
            </Flex>
        </Layout>
    )
}

export default OpportunitiesPage
