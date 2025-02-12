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
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const { apy, projectedApy, isLoading, sDolaExRate, sDolaTotalAssets, weeklyRevenue } = useStakedDola(dbrPrice);
    const { evolution, timestamp: lastDailySnapTs, isLoading: isLoadingEvolution } = useDolaStakingEvolution();
    const [thirtyDayAvg, setThirtyDayAvg] = useState(0);
     useEffect(() => {
            if (isLoading || isLoadingEvolution || !evolution?.length) return;
            const now = Date.now();
            const nowUtcDate = timestampToUTC(now);
            const data = evolution
                .filter(d => timestampToUTC(d.timestamp) !== nowUtcDate)
                .concat([
                    {
                        ...evolution[evolution.length - 1],
                        timestamp: now - (1000 * 120),
                        apy,
                    }
                ]);
            setThirtyDayAvg(getAvgOnLastItems(data, 'apy', 30));
        }, [lastDailySnapTs, isLoadingEvolution, evolution, sDolaTotalAssets, apy, isLoading]);
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - sDOLA Comparator</title>
                <meta name="og:title" content="Inverse Finance - sDOLA Comparator" />
                <meta name="og:description" content="Compare sDOLA Yields across Ethereum" />
                <meta name="description" content="Compare sDOLA Yields across Ethereum" />
                <meta name="keywords" content="Inverse Finance, sDOLA yield comparison" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/firm-page.png" />
            </Head>
            <AppNav active="More" activeSubmenu="Compare sDOLA" />
            <ErrorBoundary>
                <VStack spacing='8' w="50rem" maxW="95vw" mt="4">
                    <SDolaComparator thirtyDayAvg={thirtyDayAvg} />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default SDolaComparatorPage
