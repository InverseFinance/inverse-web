import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmUsers } from '@app/components/F2/Infos/FirmUsers'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'

export const F2UsersPage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM Users</title>
            </Head>
            <AppNav active="Transparency" activeSubmenu="FiRM users" hideAnnouncement={true} />
            <TransparencyTabs active="firm-users" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <FirmUsers />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2UsersPage
