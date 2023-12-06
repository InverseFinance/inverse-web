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
                <meta name="og:title" content="" />
                <meta name="og:description" content="" />
                <meta name="description" content="" />
                <meta name="keywords" content="" />
                <meta name="twitter:image:alt" content="" />
                <meta name="twitter:site" content="" />
                <meta name="twitter:image:alt" content="" />
                <meta property="twitter:card" content="" />
            </Head>
            <AppNav active="Earn" activeSubmenu="Yield Opportunities" />
            <Flex direction="column" w={{ base: 'full' }} pt='8' maxWidth="1100px">
                <Oppys />
            </Flex>
        </Layout>
    )
}

export default EarnPage
