import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmPositions } from '@app/components/F2/liquidations/firm-positions'

export const F2PositionsPage = () => {

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM Positions</title>
            </Head>
            <AppNav active="Earn" activeSubmenu="Liquidate Loans" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    <FirmPositions />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PositionsPage
