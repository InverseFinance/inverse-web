import { VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { SDolaComparator } from '@app/components/F2/SDolaComparator'
import { useDolaStakingEvolution, useStakedDola } from '@app/util/dola-staking'
import { useEffect, useState } from 'react'
import { getAvgOnLastItems, timestampToUTC } from '@app/util/misc'
import { useDBRPrice } from '@app/hooks/useDBR'

export const SDolaComparatorPage = () => {
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - sDOLA Comparator</title>
                <meta name="og:title" content="Inverse Finance - sDOLA Comparator" />
                <meta name="og:description" content="Compare sDOLA Yields across Ethereum" />
                <meta name="description" content="Compare sDOLA Yields across Ethereum" />
                <meta name="keywords" content="Inverse Finance, sDOLA yield comparison" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/inverse-alert-v2.png" />
            </Head>
            <AppNav active="More" activeSubmenu="Compare sDOLA" />
            <ErrorBoundary>
                <VStack spacing='8' w="50rem" maxW="95vw" mt="4">
                    <SDolaComparator />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default SDolaComparatorPage
