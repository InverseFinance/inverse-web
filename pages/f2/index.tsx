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

export const F2PAGE = () => {
    const account = useAccount();
    const { isOpen: isDbrOpen, onOpen: onDbrOpen, onClose: onDbrClose } = useDisclosure();
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - F2</title>
            </Head>
            <AppNav active="Markets" activeSubmenu="Fixed Rate Markets" />
            <F2DbrInfosModal
                onClose={onDbrClose}
                isOpen={isDbrOpen}
            />
            <ErrorBoundary>
                <VStack w='full' maxW="84rem">
                    <ErrorBoundary description="Failed to load header"><F2Header /></ErrorBoundary>
                    <ErrorBoundary description="Failed to load Dbr Health">
                        <VStack px='6' w='full'>
                            <DbrHealth account={account} onModalOpen={onDbrOpen} />
                        </VStack>
                    </ErrorBoundary>
                    <ErrorBoundary description="Failed to Markets">
                        <F2Markets />
                    </ErrorBoundary>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE
