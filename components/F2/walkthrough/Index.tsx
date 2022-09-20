import { VStack, useMediaQuery, FlexProps } from '@chakra-ui/react'
import Container from '@app/components/common/Container'

import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useAccountDBRMarket, useDBRPrice } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'
import { BigImageButton } from '@app/components/common/Button/BigImageButton'
import { TOKENS } from '@app/variables/tokens'
import { getNetworkConfigConstants } from '@app/util/networks'

import { F2WalkthroughIntro } from './Intro'
import { F2WalkthroughCollateral } from './Collateral'
import { useWeb3React } from '@web3-react/core'
import { useAccount } from '@app/hooks/misc'
import React from 'react'
import { useRouter } from 'next/router'
import { F2WalkthroughDebt } from './Debt'
import { F2WalkthroughDuration } from './Duration'

const { DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const F2MarketContext = React.createContext<{
    market: F2Market,
    colDecimals: number,
    account: string,
    signer: JsonRpcSigner,
    step: number,
    duration: number,
    collateralAmount: numbner,
    debtAmount: number,
    dbrPrice: number,
    isSmallerThan728: boolean,
    isDeposit: boolean,
}>({

});

export const F2Walkthrough = ({
    market,
    ...props
}: {
    market: F2Market
} & Partial<FlexProps>) => {
    const router = useRouter();
    const colDecimals = market.underlying.decimals;
    const { library } = useWeb3React();
    const account = useAccount();
    const [step, setStep] = useState(1);
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(12);
    const [collateralAmount, setCollateralAmount] = useState('');
    const [debtAmount, setDebtAmount] = useState('');
    const [isDeposit, setIsDeposit] = useState(true);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { price: dbrPrice } = useDBRPrice();

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance } = useAccountDBRMarket(market, account);

    const dbrCover = debtAmount / (365 / duration);
    const dbrCoverDebt = debtAmount * dbrPrice / (365 / duration);

    const {
        newDebt, newDeposits
    } = f2CalcNewHealth(market, deposits, debt, collateralAmount, debtAmount, perc);

    const {
        newPerc, newLiquidationPrice, newCreditLimit, newDebt: newTotalDebt
    } = f2CalcNewHealth(market, deposits, debt + dbrCoverDebt, collateralAmount, debtAmount, perc);

    const handleAction = (amount: BigNumber) => {
        if (!library?.getSigner()) { return }
        alert('Simple-Mode Contract is not implemented yet - Please use Advanced-Mode for now');
    }

    const handleCollateralChange = (floatNumber: number) => {
        setCollateralAmount(floatNumber)
    }

    const handleDebtChange = (floatNumber: number) => {
        setDebtAmount(floatNumber)
    }

    const handleDurationChange = (duration: number, typedValue: number, type: string) => {
        setDurationTypedValue(typedValue);
        setDurationType(type);
        setDuration(duration);
    }

    const btnLabel = isDeposit ? `Deposit & Borrow` : 'Withdraw';
    const btnMaxlabel = `${btnLabel} Max`;
    const isFormFilled = (!!collateralAmount && !!debtAmount) || debt > 0 || newDebt > 0;
    const riskColor = !isFormFilled ? 'mainTextColor' : getRiskColor(newPerc);

    const handleStepChange = (newStep: number) => {
        router.push({ hash: `step${newStep}` });
    }

    useEffect(() => {
        const stepString = location.hash.replace(/#step/, '');
        if (stepString && !isNaN(parseInt(stepString))) {
            setStep(parseInt(stepString));
        } else if (step !== 0) {
            setStep(1);
        }
    }, [router])

    useEffect(() => {
        window['walkthrough-container'].scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }, [step]);

    return <Container
        noPadding
        p="0"
        label={isSmallerThan728 ? 'Deposit & Borrow' : `Deposit ${market.name} and Borrow DOLA`}
        description={`Quick and Easy Fixed-Rate Borrowing - Learn More`}
        href="https://docs.inverse.finance/inverse-finance/about-inverse"
        image={isSmallerThan728 ? undefined : <BigImageButton bg={`url('/assets/dola.png')`} h="50px" w="80px" />}
        w='full'
        {...props}
    >
        <F2MarketContext.Provider value={{
            market,
            colDecimals,
            account,
            signer: library?.getSigner(),
            step,
            duration,
            collateralAmount,
            debtAmount,
            dbrPrice,
            dbrCoverDebt,
            isSmallerThan728,
            isDeposit,
            collateralBalance,
            bnDeposits,
            bnWithdrawalLimit,
            bnCollateralBalance,
            deposits,
            newDeposits,
            dolaToken,
            newPerc,
            debt,
            newDebt,
            bnDolaLiquidity,
            newCreditLimit,
            durationType,
            durationTypedValue,
            riskColor,
            dbrCover,
            newLiquidationPrice,
        }}>
            <VStack position="relative" w='full' px='2%' py="2" alignItems="center" spacing="6">
                {
                    step === 1 && <F2WalkthroughIntro onStepChange={handleStepChange} />
                }
                {
                    step === 2 && <F2WalkthroughCollateral onStepChange={handleStepChange} onChange={handleCollateralChange} />
                }
                {
                    step === 3 && <F2WalkthroughDuration onStepChange={handleStepChange} onChange={handleDurationChange} />
                }
                {
                    step === 4 && <F2WalkthroughDebt onStepChange={handleStepChange} onChange={handleDebtChange} />
                }
            </VStack>
        </F2MarketContext.Provider>
    </Container>
}