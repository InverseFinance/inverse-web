import { Divider, useDisclosure, VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { F2Header } from '@app/components/F2/F2Header'
import { F2Markets } from '@app/components/F2/F2Markets'
import { useAccount } from '@app/hooks/misc'
import { useAccountDBR } from '@app/hooks/useDBR'
import { DbrBar, FirmBar } from '@app/components/F2/Infos/InfoBar'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'

export const F2PAGE = () => {
    const account = useAccount();
    const { debt } = useAccountDBR(account);
    return (
        <Layout>
            <Head>
                <title>{process.env.NEXT_PUBLIC_TITLE} - FiRM</title>
            </Head>
            <AppNav active="Borrow" activeSubmenu="FiRM" />
            <ErrorBoundary>
                <VStack pt="4" w='full' maxW="84rem">
                    {/* <ErrorBoundary description="Failed to load header"><F2Header /></ErrorBoundary> */}
                    <ErrorBoundary description="Failed to FiRM header">
                        <VStack px='6' w='full'>
                            <FirmBar />
                        </VStack>
                    </ErrorBoundary>
                    <Divider display={{ base: 'inline-block', sm: 'none' }} />
                    {
                        !!account && debt > 0 && <ErrorBoundary description="Failed to load Dbr Health">
                            <VStack pt={{ md: '6' }} px='6' w='full'>
                                <DbrBar account={account} />
                            </VStack>
                        </ErrorBoundary>
                    }
                    <ErrorBoundary description="Failed to Markets">
                        <F2Markets />
                    </ErrorBoundary>
                    <VStack py="6" px='6' w='full'>
                        <FirmFAQ defaultCollapse={true} collapsable={true} />
                    </VStack>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2PAGE
