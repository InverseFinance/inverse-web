import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { DbrSpenders } from '@app/components/F2/liquidations/dbr-spenders'

export const F2DbrSpendersPage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM DBR Deficits</title>
            </Head>
            <AppNav active="Earn" activeSubmenu="Replenish DBR" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <DbrSpenders />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2DbrSpendersPage
