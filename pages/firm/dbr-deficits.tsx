import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { DbrDeficits } from '@app/components/F2/liquidations/dbr-deficits'

export const F2DbrDeficitsPage = () => {

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - FiRM DBR Deficits</title>
            </Head>
            <AppNav active="Earn" activeSubmenu="Replenish DBR" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <DbrDeficits />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2DbrDeficitsPage
