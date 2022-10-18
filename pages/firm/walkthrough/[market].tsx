import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { VStack, Text } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { F2Walkthrough } from '@app/components/F2/walkthrough/WalkthroughContainer'
import { MarketBar } from '@app/components/F2/Infos/MarketBar'

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2MarketPage = ({ market }: { market: string }) => {
    const { markets } = useDBRMarkets(market);
    const f2market = markets.length > 0 ? markets[0] : undefined;

    return (
        <Layout>
            <AppNav active="Borrow" activeSubmenu={`${market} Market`} />
            <ErrorBoundary>
                <VStack pt="8" w='full' alignItems="center" px={{ base: '2', lg: '8' }} spacing="0">
                    <MarketBar market={f2market} maxW='700px' alignItems="center" px="2" />
                    <VStack id="walkthrough-container" w='full' maxW={'700px'} alignItems="flex-start" py="8" spacing="8">
                        {
                            !f2market ? <Text>Market not found</Text>
                                : <F2Walkthrough market={f2market} />
                        }
                    </VStack>
                </VStack>
            </ErrorBoundary>
        </Layout>
    )
}

export default F2MarketPage

// static with revalidate as on-chain proposal content cannot change but the status/votes can
export async function getStaticProps(context) {
    const { market } = context.params;

    return {
        props: { market },
    }
}

export async function getStaticPaths() {
    if (!['1', '31337'].includes(process.env.NEXT_PUBLIC_CHAIN_ID)) {
        return { paths: [], fallback: true }
    }
    return {
        paths: F2_MARKETS.map(m => `/firm/${m.name}`),
        fallback: true,
    }
}
