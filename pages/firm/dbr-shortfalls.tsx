import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { DbrShortfalls } from '@app/components/F2/liquidations/dbr-shortfalls'

export const F2DbrShortfallsPage = () => {

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - FiRM DBR Shortfalls</title>
            </Head>
            <AppNav active="Borrow" activeSubmenu="FiRM" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <DbrShortfalls />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2DbrShortfallsPage
