import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'

export const F2PAGE = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM FAQ</title>
            </Head>
            <AppNav active="Borrow" activeSubmenu="FiRM" />
            <ErrorBoundary>
                <VStack w='full' maxW="64rem" mt="4">
                    <FirmFAQ />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE
