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
                <title>Inverse Finance - Rate Comparator</title>
            </Head>
            <AppNav active="Borrow" activeSubmenu="FiRM" />
            <ErrorBoundary>
                <VStack w='full' maxW="64rem" mt="4">
                    <RateComparator />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default RateComparatorPage
