import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { DbrPendingRewards } from '@app/components/F2/rewards/DbrPendingRewards'

export const FirmStakers = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - INV stakers</title>
            </Head>
            <AppNav active="FiRM" activeSubmenu="Stakers" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <DbrPendingRewards />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmStakers
