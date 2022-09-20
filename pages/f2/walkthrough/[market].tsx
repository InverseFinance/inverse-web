import { SimmpleBreadcrumbs } from '@app/components/common/Breadcrumbs'
import Layout from '@app/components/common/Layout'
import { AppNav } from '@app/components/common/Navbar'

import { getNetworkConfigConstants } from '@app/util/networks'
import { useDBRMarkets } from '@app/hooks/useDBR'

import { HStack, Stack, VStack, Text, useDisclosure, Slide } from '@chakra-ui/react'
import { ErrorBoundary } from '@app/components/common/ErrorBoundary'

import { DbrHealth } from '@app/components/F2/bars/DbrHealth'
import { useWeb3React } from '@web3-react/core'
import { Web3Provider } from '@ethersproject/providers'
import { CreditLimitBar } from '@app/components/F2/bars/CreditLimitBar'
import { F2CollateralForm } from '@app/components/F2/forms/F2CollateralForm'
import { F2BorrowForm } from '@app/components/F2/forms/F2BorrowForm'
import { useState } from 'react'
import { SettingsIcon } from '@chakra-ui/icons'
import { F2CombinedForm } from '@app/components/F2/forms/F2CombinedForm'
import { MarketInfos } from '@app/components/F2/Infos/MarketInfos'
import { F2DbrInfosModal } from '@app/components/F2/Modals/F2DbrInfosModal'
import { F2HealthInfosModal } from '@app/components/F2/Modals/F2HealthInfosModal'
import { useAccount } from '@app/hooks/misc'
import { F2WalkthroughIntro } from '@app/components/F2/walkthrough/Intro'
import { F2WalkthroughDeposit } from '@app/components/F2/walkthrough/Deposit'

const { F2_MARKETS } = getNetworkConfigConstants();

export const F2MarketPage = ({ market }: { market: string }) => {
    const [newCollateralAmount, setNewCollateralAmount] = useState(0);
    const [newDebtAmount, setNewDebtAmount] = useState(0);
    const [step, setStep] = useState('1');
    const { library } = useWeb3React<Web3Provider>();
    const account = useAccount();
    const { markets } = useDBRMarkets(market);
    const f2market = markets.length > 0 ? markets[0] : undefined;
    const { isOpen: isDbrOpen, onOpen: onDbrOpen, onClose: onDbrClose } = useDisclosure();
    const { isOpen: isHealthOpen, onOpen: onHealthOpen, onClose: onHealthClose } = useDisclosure();

    const handleStepChange = (step: string) => {
        setStep(step);
    }

    return (
        <Layout>
            <AppNav active="Markets" activeSubmenu={`${market} Market`} />
            <F2DbrInfosModal
                onClose={onDbrClose}
                isOpen={isDbrOpen}
            />
            <F2HealthInfosModal onClose={onHealthClose} isOpen={isHealthOpen} />
            <ErrorBoundary>
                <VStack w='full' maxW={'750px'} alignItems="flex-start" p="8" spacing="8">
                    <Stack direction={{ base: 'column', sm: 'row' }} w='full' justify="space-between">
                        <SimmpleBreadcrumbs
                            breadcrumbs={[
                                { label: 'F2', href: '/f2' },
                                { label: `${f2market?.name || market} Market`, href: '#' },
                            ]}
                        />
                    </Stack>
                    {
                        !f2market ? <Text>Market not found</Text>
                            : <VStack
                                alignItems="flex-start"
                                w='full'
                                direction={{ base: 'column', lg: 'row' }}
                                spacing="12"
                            >
                                {
                                    step === '1' && <F2WalkthroughIntro market={f2market} onStepChange={handleStepChange} />      
                                }                          
                                {
                                    step === '2' && <F2WalkthroughDeposit market={f2market} onStepChange={handleStepChange} /> 
                                }                               
                            </VStack>
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
        props: { market: market },
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
