import { Flex, Stack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';

import { DOLATokenCard, INVTokenCard, DBRTokenCard } from '@app/components/common/Cards/TokenCard';

export const TokensPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Tokens</title>
                <meta name="og:title" content="Inverse Finance - Tokens" />                
            </Head>
            <AppNav active="Tokens" activeSubmenu="Overview" />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                <Stack mt="8" w='full' direction={{ base: 'column', lg: 'row' }} spacing="10">
                    <DOLATokenCard />
                    <INVTokenCard />
                    <DBRTokenCard />
                </Stack>
            </Flex>
        </Layout>
    )
}

export default TokensPage