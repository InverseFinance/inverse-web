import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { CollateralRequestForm } from '@app/components/F2/CollateralRequest/CollateralRequestForm'

export const F2PAGE = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Request Collateral</title>
            </Head>
            <AppNav active="More" activeSubmenu="Request Collateral" />
            <ErrorBoundary>
                <VStack w='full' maxW="600px" mt="4">
                    <CollateralRequestForm />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE