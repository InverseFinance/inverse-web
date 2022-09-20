import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { Stack, VStack, Text } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { F2Walkthrough } from '@app/components/F2/walkthrough'

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2MarketPage = ({ market }: { market: string }) => {
    const { markets } = useDBRMarkets(market);
    const f2market = markets.length > 0 ? markets[0] : undefined;

    return (
        <Layout>
            <AppNav active="Markets" activeSubmenu={`${market} Market`} />
            <ErrorBoundary>
                <VStack id="walkthrough-container" w='full' maxW={'650px'} alignItems="flex-start" px="8" spacing="8">
                    <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify="space-between">
                        {/* <SimmpleBreadcrumbs
                            breadcrumbs={[
                                { label: 'F2', href: '/f2' },
                                { label: `${f2market?.name || market} Market`, href: '#' },
                            ]}
                        /> */}
                    </Stack>
                    {
                        !f2market ? <Text>Market not found</Text>
                            : <F2Walkthrough market={f2market} />
                    }
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
        paths: F2_MARKETS.map(m => `/f2/${m.name}`),
        fallback: true,
    }
}
