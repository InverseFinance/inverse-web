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

export const STEPS = ['Deposit', 'Duration', 'Borrow', 'Recap'];
export const STEPS_NO_HELPER = ['Deposit', 'Borrow', 'Duration', 'Recap'];

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

    const steps = !!market?.helper ? STEPS : STEPS_NO_HELPER;
    const stepCase = steps[step-1];

    return <VStack
        noPadding
        p="0"
        m="0"
        w='full'        
        {...props}
    >
        {
            !!market && <VStack justify="space-between" position="relative" w='full' pb="2" alignItems="flex-start" spacing="6">
                {
                    step > 0 && <StepsBar
                        step={step}
                        steps={steps}
                        onStepChange={handleStepChange}
                    />
                }
                {
                    stepCase === 'Deposit' && <F2WalkthroughCollateral onStepChange={handleStepChange} onChange={handleCollateralChange} />
                }
                {
                    stepCase === 'Duration' && <F2WalkthroughDuration onStepChange={handleStepChange} onChange={handleDurationChange} />
                }
                {
                    stepCase === 'Borrow' && <F2WalkthroughDebt onStepChange={handleStepChange} onChange={handleDebtChange} />
                }
                {
                    stepCase === 'Recap' && <F2WalkthroughRecap onStepChange={handleStepChange} />
                }
                {
                    !market.dolaLiquidity && <WarningMessage alertProps={{w:'full'}} description="No DOLA liquidity at the moment" />
                }
            </VStack>
        }
    </VStack>
}