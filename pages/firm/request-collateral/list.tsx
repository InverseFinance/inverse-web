import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { CollateralRequestList } from '@app/components/F2/CollateralRequest/CollateralRequestList'

export const F2PAGE = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Requested Collaterals</title>
                <meta name="og:title" content="Inverse Finance - Requested Requested" />
                <meta name="og:description" content="Requested collaterals" />
                <meta name="description" content="Requested collaterals" />
                <meta name="keywords" content="Inverse Finance, FiRM, collateral request, collateral" />
            </Head>
            <AppNav active="More" activeSubmenu="Request Collateral" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <CollateralRequestList />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE
