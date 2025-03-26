import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { FirmPositions } from '@app/components/F2/liquidations/firm-positions'
import { useRouter } from 'next/router'

export const F2PositionsPage = () => {
    const router = useRouter();
    const { vnetPublicId } = router.query;

    return (
        <Layout>
            <Head>
                <title>Inverse Finance - FiRM Positions</title>
            </Head>
            <AppNav active="Markets" activeSubmenu="Liquidate Loans" />
            <ErrorBoundary>
                <VStack w='full' maxW="1200px" mt="4">
                    {
                        !!vnetPublicId && <FirmPositions vnetPublicId={vnetPublicId as string} />
                    }
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PositionsPage
