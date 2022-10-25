import { useDisclosure, VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { F2Header } from '@app/components/F2/F2Header'
import { DbrHealth } from '@app/components/F2/bars/DbrHealth'
import { F2Markets } from '@app/components/F2/F2Markets'
import { useAccount } from '@app/hooks/misc'
import { F2DbrInfosModal } from '@app/components/F2/Modals/F2DbrInfosModal'
import { useAccountDBR } from '@app/hooks/useDBR'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'
import { FirmPositions } from '@app/components/F2/liquidations/firm-positions'

export const F2PositionsPage = () => {

    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - FiRM Shortfalls</title>
            </Head>
            <AppNav active="Borrow" activeSubmenu="FiRM" />
            <ErrorBoundary>
                <VStack w='full' maxW="64rem" mt="4">
                    <FirmPositions />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PositionsPage
