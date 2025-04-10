import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmMarketsAndPositionsRenderer } from '@app/components/F2/FirmMarketsAndPositions'
import { useDBRMarkets } from '@app/hooks/useDBR'

export const FirmAdminPage = () => {
    const { markets, isLoading, timestamp } = useDBRMarkets();
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Firm Admin</title>
            </Head>
            <AppNav hideAnnouncement={true} active="Markets" activeSubmenu="Liquidate Loans" />
            <ErrorBoundary>
                <VStack w='full' maxW="98%" mt="4">
                    <FirmMarketsAndPositionsRenderer
                        defaultTab={'Markets'}
                        markets={markets}
                        positions={[]}
                        isLoading={isLoading}
                        timestamp={timestamp}
                        onlyShowDefaultTab={true}
                    />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default FirmAdminPage
