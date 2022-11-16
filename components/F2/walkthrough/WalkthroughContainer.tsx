import { VStack, FlexProps } from '@chakra-ui/react'
import Container from '@app/components/common/Container'

import { F2Market } from '@app/types'
import { useContext } from 'react'

import { F2WalkthroughCollateral } from './Collateral'
import React from 'react'
import { F2WalkthroughDebt } from './Debt'
import { F2WalkthroughDuration } from './Duration'
import { F2WalkthroughRecap } from './Recap'

import { StepsBar } from './StepsBar'
import { F2MarketContext } from '../F2Contex'
import { WarningMessage } from '@app/components/common/Messages'

export const F2Walkthrough = ({
    ...props
}: {
    market: F2Market
} & Partial<FlexProps>) => {
    const {
        market,
        step,
        setStep,
        handleStepChange,
        handleDurationChange,
        handleDebtChange,
        handleCollateralChange,
    } = useContext(F2MarketContext);


    return <Container
        noPadding
        p="0"
        m="0"
        w='full'
        contentProps={{ bg: 'transparent', boxShadow: 'none', p: '0' }}
        {...props}
    >
        {
            !!market && <VStack justify="space-between" position="relative" px="2" w='full' pb="2" alignItems="flex-start" spacing="6">
                {
                    step > 0 && <StepsBar
                        step={step}
                        onStepChange={handleStepChange}
                    />
                }
                {
                    step === 1 && <F2WalkthroughCollateral onStepChange={handleStepChange} onChange={handleCollateralChange} />
                }
                {
                    step === 2 && <F2WalkthroughDuration onStepChange={handleStepChange} onChange={handleDurationChange} />
                }
                {
                    step === 3 && <F2WalkthroughDebt onStepChange={handleStepChange} onChange={handleDebtChange} />
                }
                {
                    step === 4 && <F2WalkthroughRecap onStepChange={handleStepChange} />
                }
                {
                    !market.dolaLiquidity && <WarningMessage alertProps={{w:'full'}} description="No DOLA liquidity at the moment" />
                }
            </VStack>
        }
    </Container>
}