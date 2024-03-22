import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { TransparencyTabs } from '@app/components/Transparency/TransparencyTabs'
import { VeNftEvolutionWrapper } from '@app/components/Transparency/VeNftEvolution'
import { HStack, VStack, Text } from '@chakra-ui/react'

export const veNftsPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - veNFTs</title>
            </Head>
            <AppNav active="Transparency" activeSubmenu="veNfts" hideAnnouncement={true} />
            <TransparencyTabs active="veNfts" />            
            <ErrorBoundary>
                <VStack pt="4" spacing="4" w='full' maxW={{ base: '94%', '2xl': '90rem' }}>
                    <ErrorBoundary description="Failed to Dashboard">
                        <VeNftEvolutionWrapper />
                    </ErrorBoundary>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default veNftsPage
