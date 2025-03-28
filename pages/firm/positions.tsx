import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmMarketsAndPositions } from '@app/components/F2/FirmMarketsAndPositions'

export const F2PositionsPage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM Positions</title>
            </Head>
            <AppNav active="Markets" activeSubmenu="Liquidate Loans" />
            <ErrorBoundary>
                <VStack w='full' maxW="98%" mt="4">
                    <FirmMarketsAndPositions defaultTab="Positions" />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PositionsPage
