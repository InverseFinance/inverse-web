import { HStack, SimpleGrid, Text, VStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'
import Head from 'next/head'
import { RateComparator } from '@app/components/F2/RateComparator'
import { useDBRMarkets } from '@app/hooks/useDBR'
import { MarketImage } from '@app/components/common/Assets/MarketImage'
import Link from '@app/components/common/Link'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'
import Container from '@app/components/common/Container'
import { SplashedText } from '@app/components/common/SplashedText'
import { useAppTheme } from '@app/hooks/useAppTheme'
import { SkeletonBlob } from '@app/components/common/Skeleton'

export const RateComparatorPage = () => {
    const { markets, isLoading } = useDBRMarkets();
    const { themeStyles } = useAppTheme();
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
                <VStack spacing='8' w="80rem" maxW="95vw" mt="4">
                    <SplashedText
                        as="h1"
                        color={`${themeStyles?.colors.mainTextColor}`}
                        fontSize={{ base: '24px', lg: '38px' }}
                        fontWeight="800"
                        lineHeight='1'
                        splashProps={{
                            opacity: 0.6,
                            minH: '10px',
                            h: { base: '10px', lg: '30px' },
                            w: { base: '110px', lg: '200px' },
                            left: { base: '-20px', lg: '-50px' },
                            top: { base: '15px', lg: '10px' }
                        }
                        }
                    >
                        Rethink The Way You Borrow
                    </SplashedText>
                    <RateComparator />
                    <Container
                        noPadding
                        p="0"
                        label="List of Active FiRM Markets"
                        description="Go to FiRM"
                        href="/firm"
                    >
                        <SimpleGrid minChildWidth="250px" gap="4" w='full'>
                            {
                                isLoading ? <SkeletonBlob noOfLines={1} w='full' h='30px' /> : markets
                                    .filter(m => !m.borrowPaused)
                                    .map(m => {
                                        return <HStack key={m.name}>
                                            <MarketImage imgProps={{ borderRadius: '50px' }}  {...m} size={30} image={m.underlying.image} />
                                            <Link isExternal={true} target="_blank" fontSize="20px" fontWeight='extrabold' href={`/firm/${m.name}`} textDecoration="underline" cursor="pointer">
                                                {m.name}
                                            </Link>
                                        </HStack>
                                    })
                            }
                        </SimpleGrid>
                    </Container>
                    <FirmFAQ />
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default RateComparatorPage
