import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { JrDolaStakersTable } from '@app/components/F2/junior/JrDolaStakers'

export const JrDolaStakers = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - jrDOLA stakers</title>
            </Head>
            <AppNav active="Stake" activeSubmenu="jrDOLA" />
            <ErrorBoundary>
                <VStack w='full' maxW="98%" mt="4">
                    <JrDolaStakersTable />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default JrDolaStakers
