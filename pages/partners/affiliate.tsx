import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmUsers } from '@app/components/F2/Infos/FirmUsers'

export const FirmAffiliatePage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Affiliate Dashbboard</title>
            </Head>
            <AppNav active="More" activeSubmenu="Affiliate Dashboard" hideAnnouncement={true} />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <FirmUsers />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAffiliatePage
