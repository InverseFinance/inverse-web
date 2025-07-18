import { Image, VStack, Text, HStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { useAccount } from '@app/hooks/misc'
import { UserDashboard } from '@app/components/F2/UserDashboard'
import { SERVER_BASE_URL } from '@app/config/constants'

export const UserDashboardPage = ({
    marketsData,
    firmTvlData,
    currentCirculatingSupply,
    dbrPriceUsd,
    dbrDolaPrice,
    dolaPriceUsd,
}: {
    marketsData: any,
    firmTvlData: any,
    currentCirculatingSupply: number,
    dbrPriceUsd: number,
    dolaPriceUsd: number,
    dbrDolaPrice: number,
}) => {
    const account = useAccount();    
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Dashboard</title>
                <meta name="og:description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="description" content="FiRM is Inverse Finance's Fixed Rate Market, borrow DOLA with the DOLA Borrowing Right token DBR. Rethink the way you borrow!" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/inverse-alert-v2.png" />
            </Head>
            <AppNav active="Dashboard" />
            <ErrorBoundary>
                <VStack pt="4" spacing="4" w='full' maxW={{ base: '94%', '2xl': '90rem' }}>
                    <HStack alignItems="center" justify="space-between" w='full'>
                        <Text className="heading-font" fontWeight="extrabold" fontSize="40px">My Dashboard</Text>
                        <Image borderRadius="5px" display={{ base: 'none', sm: 'inline-block' }} w='200px' src={`/assets/inverse-logo-banner.png?`} />
                    </HStack>
                    <ErrorBoundary description="Failed to Dashboard">
                        <UserDashboard account={account} dbrDolaPrice={dbrDolaPrice} marketsData={marketsData} firmTvlData={firmTvlData} dbrPriceUsd={dbrPriceUsd} />
                    </ErrorBoundary>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export async function getServerSideProps(context) {
    context.res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    const [
        marketsData,
        firmTvlData,
        currentCirculatingSupply,
        dbrData,
        dolaPriceData,
    ] = await Promise.all([
        fetch(`${SERVER_BASE_URL}/api/f2/fixed-markets?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/f2/tvl?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola/circulating-supply?cacheFirst=true`).then(res => res.text()),
        fetch(`${SERVER_BASE_URL}/api/dbr?cacheFirst=true`).then(res => res.json()),
        fetch(`${SERVER_BASE_URL}/api/dola-price?cacheFirst=true`).then(res => res.json()),
    ]);
    const dbrPriceUsd = dbrData.priceUsd;
    const dbrDolaPrice = dbrData.priceDola;
    const dolaPriceUsd = dolaPriceData['dola-usd'] || 1;
    return {
        props: {
            marketsData: marketsData,
            firmTvlData,
            currentCirculatingSupply: parseFloat(currentCirculatingSupply),
            dbrPriceUsd,
            dbrDolaPrice,
            dolaPriceUsd,
         },
    };
}

export default UserDashboardPage
