import { HStack, Text, VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { RateComparator } from '@app/components/F2/RateComparator'
import { InfoMessage } from '@app/components/common/Messages'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { MarketImage } from '@app/components/common/Assets/MarketImage'
import Link from '@app/components/common/Link'

export const RateComparatorPage = () => {
    const { markets, isLoading } = useDBRMarkets();
    markets.sort((a, b) => a.name < b.name ? -1 : 1)
    return (
        <Layout>
            <Head>
                <title>Inverse Finance - Rate Comparison</title>
                <meta name="og:title" content="Inverse Finance - Rate Comparison" />
                <meta name="og:description" content="Compare Borrowing Rates across Ethereum" />
                <meta name="description" content="Compare Borrowing Rates across Ethereum" />
                <meta name="keywords" content="Inverse Finance, borrow rates comparison" />
                <meta name="og:image" content="https://inverse.finance/assets/social-previews/firm-page.png" />
            </Head>
            <AppNav active="More" activeSubmenu="Compare Rates" />
            <ErrorBoundary>
                <VStack spacing='8' w='full' maxW="80rem" mt="4">
                    <RateComparator />
                    <InfoMessage
                        alertProps={{ w: 'full' }}
                        title="List of Active Markets on FiRM:"
                        alertTitleProps={{ fontSize: '20px', fontWeight: 'extrabold' }}
                        background="url('/assets/social-previews/firm.png')"
                        description={
                            <HStack pt="4" justify="space-between">
                                {
                                    isLoading ? <Text>...</Text> : markets
                                        .filter(m => !m.borrowPaused)
                                        .map(m => {
                                            return <HStack key={m.name}>
                                                <MarketImage imgProps={{ borderRadius: '50px' }}  {...m} size={30} image={m.underlying.image} />
                                                <Link target="_blank" fontSize="20px" fontWeight='extrabold' href={`/firm/${m.name}`} textDecoration="underline" cursor="pointer">
                                                    {m.name}
                                                </Link>
                                            </HStack>
                                        })
                                }
                            </HStack>
                        }
                    />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default RateComparatorPage
