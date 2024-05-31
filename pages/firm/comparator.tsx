import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { RateComparator } from '@app/components/F2/RateComparator'

export const RateComparatorPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Rate Comparison</title>
            </Head>
            <AppNav active="More" activeSubmenu="Compare Rates" />
            <ErrorBoundary>
                <VStack w='full' maxW="64rem" mt="4">
                    <RateComparator />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default RateComparatorPage
