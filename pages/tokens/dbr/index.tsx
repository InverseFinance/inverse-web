import { Flex, Stack } from '@chakra-ui/react'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head';
import { DBRInfos } from '@app/components/F2/Infos/DBRInfos';
import { DBRTokenCard } from '@app/components/common/Cards/TokenCard';

export const TokensPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - DBR token</title>
                <meta name="og:title" content="Inverse Finance - DBR token" />                
            </Head>
            <AppNav active="Tokens" activeSubmenu="Overview" />
            <Flex direction="column" w={{ base: 'full' }} p={{ base: '4' }} maxWidth="1140px">
                <Stack mt="8" w='full' direction={{ base: 'column', lg: 'row' }} spacing="10">
                    <DBRTokenCard clickable={false} />
                    <DBRInfos />
                </Stack>
            </Flex>
        </Layout>
    )
}

export default TokensPage