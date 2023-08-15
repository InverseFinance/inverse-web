import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmUsers } from '@app/components/F2/Infos/FirmUsers'

export const F2UsersPage = () => {

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - FiRM Users</title>
            </Head>
            <AppNav active="Earn" activeSubmenu="Liquidate Loans" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <FirmUsers />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2UsersPage
