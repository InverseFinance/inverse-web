import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { HStack, Stack, VStack, Text, useDisclosure, Divider } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { DbrHealth } from '@app/components/F2/bars/DbrHealth'
import { useWeb3React } from '@web3-react/core'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { CreditLimitBar } from '@app/components/F2/bars/CreditLimitBar'
import { F2CollateralForm } from '@app/components/F2/forms/F2CollateralForm'
import { F2BorrowForm } from '@app/components/F2/forms/F2BorrowForm'
import { useState } from 'react'
import { F2CombinedForm } from '@app/components/F2/forms/F2CombinedForm'
import { F2DbrInfosModal } from '@app/components/F2/Modals/F2DbrInfosModal'
import { F2HealthInfosModal } from '@app/components/F2/Modals/F2HealthInfosModal'
import { useAccount } from '@app/hooks/misc'
import { FirmFAQ } from '@app/components/F2/Infos/FirmFAQ'
import { MarketBar } from '@app/components/F2/Infos/MarketBar'
import { F2Market } from '@app/types'
import React from 'react'
import { F2Context } from '@app/components/F2/F2Contex'
import { F2Walkthrough } from '@app/components/F2/walkthrough/WalkthroughContainer'

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2MarketPage = ({ market }: { market: string }) => {
    const [newCollateralAmount, setNewCollateralAmount] = useState(0);
    const [newDebtAmount, setNewDebtAmount] = useState(0);
    const [isWalkthrough, setIsWalkthrough] = useState(false);
    const { library } = useWeb3React<Web3Provider>();
    const account = useAccount();
    const { markets } = useDBRMarkets(market);
    const f2market = markets.length > 0 ? markets[0] : undefined;
    const { isOpen: isDbrOpen, onOpen: onDbrOpen, onClose: onDbrClose } = useDisclosure();
    const { isOpen: isHealthOpen, onOpen: onHealthOpen, onClose: onHealthClose } = useDisclosure();

    const combinedFormProps = {
        signer: library?.getSigner(),
        f2market,
        account,
        onDepositChange: (floatAmount) => setNewCollateralAmount(floatAmount),
        onDebtChange: (floatAmount) => setNewDebtAmount(floatAmount),
        onDbrOpen,
        onHealthOpen,
    }

    return (
        <Layout>
            <AppNav active="Borrow" activeSubmenu={`${market} Market`} />
            <F2DbrInfosModal
                onClose={onDbrClose}
                isOpen={isDbrOpen}
            />
            <F2HealthInfosModal onClose={onHealthClose} isOpen={isHealthOpen} />
            <ErrorBoundary>
                <F2Context market={f2market}>
                    <VStack
                        pt="5"
                        w='full'
                        maxW={isWalkthrough ? '700px' : 'full'}
                        transitionProperty="width"
                        transition="ease-in-out"
                        transitionDuration="200ms"
                        alignItems="center"
                        px={{ base: '2', lg: '8' }}
                        spacing="5"
                    >
                        <MarketBar
                            market={f2market}
                            isWalkthrough={isWalkthrough}
                            setIsWalkthrough={setIsWalkthrough}
                            w='full'
                            h="64px"
                            overflow="hidden"
                            alignItems="center"
                            pt='0'
                        />
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
                                    <F2CombinedForm
                                        {...combinedFormProps}
                                    />                                                                        
                                </VStack>
                        }                        
                        <FirmFAQ collapsable={true} defaultCollapse={true} />
                    </VStack>
                </F2Context>
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
