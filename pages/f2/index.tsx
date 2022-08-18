import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { F2Header } from '@app/components/F2/F2Header'
import { DbrHealth } from '@app/components/F2/DbrHealth'
import { F2Markets } from '@app/components/F2/F2Markets'

export const F2PAGE = () => {
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - F2</title>
            </Head>
            <AppNav active="Frontier" activeSubmenu="Overview" />
            <ErrorBoundary>
                <VStack w='full' maxW="84rem">
                    <ErrorBoundary description="Failed to load header"><F2Header /></ErrorBoundary>
                    <ErrorBoundary description="Failed to load Dbr Health">
                        <VStack px='6' w='full'><DbrHealth /></VStack>
                    </ErrorBoundary>
                    <ErrorBoundary description="Failed to Markets"><F2Markets /></ErrorBoundary>
                </VStack>                
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE
