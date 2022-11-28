import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { VStack, Text, useDisclosure, HStack } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { useEffect, useState } from 'react'
import { F2CombinedForm } from '@app/components/F2/forms/F2CombinedForm'
import { F2DbrInfosModal } from '@app/components/F2/Modals/F2DbrInfosModal'
import { F2HealthInfosModal } from '@app/components/F2/Modals/F2HealthInfosModal'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'
import { MarketBar } from '@app/components/F2/Infos/InfoBar'
import React from 'react'
import { F2Context } from '@app/components/F2/F2Contex'
import { F2Walkthrough } from '@app/components/F2/walkthrough/WalkthroughContainer'
import { useRouter } from 'next/router'
import { ArrowBackIcon } from '@chakra-ui/icons'

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2MarketPage = ({ market }: { market: string }) => {
    const router = useRouter();
    const [inited, setInited] = useState(false);
    const [isWalkthrough, setIsWalkthrough] = useState(true);
    const { markets } = useDBRMarkets(market);
    const f2market = markets.length > 0 && !!market ? markets[0] : undefined;
    const { isOpen: isDbrOpen, onOpen: onDbrOpen, onClose: onDbrClose } = useDisclosure();
    const { isOpen: isHealthOpen, onOpen: onHealthOpen, onClose: onHealthClose } = useDisclosure();

    useEffect(() => {
        if (inited) { return }
        setIsWalkthrough(router.asPath.includes('#step'))
        setInited(true);
    }, [router, inited]);

    return (
        <Layout>
            <AppNav active="Borrow" activeSubmenu={`${market} Market`} />
            <F2DbrInfosModal
                onClose={onDbrClose}
                isOpen={isDbrOpen}
            />
            <F2HealthInfosModal onClose={onHealthClose} isOpen={isHealthOpen} />
            <ErrorBoundary>
                {
                    !f2market || !market ? <Text mt="8">
                        {!f2market ? 'Loading...' : 'Market not found!'}
                    </Text>
                    : <F2Context market={f2market} isWalkthrough={isWalkthrough} setIsWalkthrough={setIsWalkthrough}>
                    <VStack
                        pt="4"                    
                        w='full'
                        maxW={isWalkthrough ? '750px' : '84rem'}
                        transitionProperty="width"
                        transition="ease-in-out"
                        transitionDuration="200ms"
                        alignItems="center"
                        px={{ base: '2', lg: '8' }}
                        spacing={{ base: '2', md: '5' }}
                    >
                        <VStack alignItems="flex-start" w='full' spacing="3">
                            <HStack transition="color ease-in-out 200ms" _hover={{ color: 'mainTextColor' }} color="secondaryTextColor" cursor="pointer" spacing="2" onClick={() => router.push('/firm')}>
                                <ArrowBackIcon fontSize="18px" _hover={{ color: 'inherit' }} color="inherit" />
                                <Text _hover={{ color: 'inherit' }} color="inherit">Back to Markets</Text>
                            </HStack>
                            <MarketBar
                                w='full'
                                minH="64px"
                                overflow="hidden"
                                alignItems="center"
                                pt='0'
                            />
                        </VStack>

                        {
                            !f2market ?
                                <Text>Market not found</Text>
                                :
                                isWalkthrough ?
                                    <VStack id="walkthrough-container" w='full' maxW={'700px'} alignItems="flex-start" pt="2" pb="8" spacing="8">
                                        <F2Walkthrough market={f2market} />
                                    </VStack>
                                    :
                                    <VStack
                                        alignItems="center"
                                        w='full'
                                        direction={{ base: 'column', lg: 'row' }}
                                        spacing="12"
                                    >
                                        <F2CombinedForm />
                                    </VStack>
                        }
                        <FirmFAQ collapsable={true} defaultCollapse={true} />
                    </VStack>
                </F2Context>
                }
            </ErrorBoundary>
        </Layout>
    )
}

export default F2MarketPage

// static with revalidate as on-chain proposal content cannot change but the status/votes can
export async function getStaticProps(context) {
    const { market } = context.params;

    return {
        props: { market: market },
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
