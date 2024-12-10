import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmAffiliateList } from '@app/components/F2/Infos/FirmAffiliateList'

export const FirmAffiliateListPage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Affiliate Dashbboard</title>
            </Head>
            <AppNav active="More" activeSubmenu="Affiliate Dashboard" hideAnnouncement={true} hideCampaignBar={true} />
            <ErrorBoundary>
                <VStack w='full' maxW="1300px" mt="4">
                    <FirmAffiliateList />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAffiliateListPage
