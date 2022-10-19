import { useMediaQuery, FlexProps } from '@chakra-ui/react'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, findMaxBorrow, getRiskColor } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useAccountDBR, useAccountDBRMarket, useDBRPrice } from '@app/hooks/useDBR'
import { useEffect, useState } from 'react'
import { TOKENS } from '@app/variables/tokens'
import { getNetworkConfigConstants } from '@app/util/networks'

import { useWeb3React } from '@web3-react/core'
import { useAccount } from '@app/hooks/misc'
import React from 'react'
import { useRouter } from 'next/router'

const { DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const F2MarketContext = React.createContext<{
    market: F2Market,
    colDecimals: number,
    account: string,
    signer: JsonRpcSigner,
    step: number,
    duration: number,
    collateralAmount: number,
    debtAmount: number,
    dbrPrice: number,
    isSmallerThan728: boolean,
    isDeposit: boolean,
}>({

});

export const F2Context = ({
    market,
    ...props
}: {
    market: F2Market
} & Partial<FlexProps>) => {
    const router = useRouter();
    const colDecimals = market.underlying.decimals;
    const { library } = useWeb3React();
    const account = useAccount();
    const [step, setStep] = useState(0);
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(12);
    const [collateralAmount, setCollateralAmount] = useState('');
    const [debtAmount, setDebtAmount] = useState('');
    const [isDeposit, setIsDeposit] = useState(true);
    const [maxBorrowable, setMaxBorrowable] = useState(0);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { price: dbrPrice } = useDBRPrice();

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance } = useAccountDBRMarket(market, account);

    const dbrCover = debtAmount / (365 / duration);
    const dbrCoverDebt = debtAmount * dbrPrice / (365 / duration);

    const {
        newDebt, newDeposits, newCreditLimit: creditLimitWithNoFees
    } = f2CalcNewHealth(market, deposits, debt, collateralAmount, debtAmount, perc);

    const {
        newPerc, newLiquidationPrice, newCreditLimit, newDebt: newTotalDebt, newCreditLeft
    } = f2CalcNewHealth(market, deposits, debt + dbrCoverDebt, collateralAmount, debtAmount, perc);

    const {
        newCreditLeft: maxBorrow
    } = f2CalcNewHealth(market, deposits, debt, collateralAmount, 0, perc);

    const { dbrExpiryDate: newDBRExpiryDate } = useAccountDBR(account, newTotalDebt);

    useEffect(() => {
        setMaxBorrowable(findMaxBorrow(market, deposits, debt, dbrPrice, duration, collateralAmount, 0, maxBorrow, perc));
    }, [market, deposits, debt, dbrPrice, duration, collateralAmount, maxBorrow, perc]);

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

    const handleStepChange = (newStep: number) => {
        router.push({ hash: `step${newStep}` });
    }

    useEffect(() => {
        const stepString = location.hash.replace(/#step/, '');
        if (stepString && !isNaN(parseInt(stepString))) {
            setStep(parseInt(stepString));
        } else if (step !== 0) {
            setStep(0);
        }
    }, [router])

    const handleAction = (amount: BigNumber) => {
        if (!library?.getSigner()) { return }
        alert('Simple-Mode Contract is not implemented yet - Please use Advanced-Mode for now');
    }

    const isFormFilled = (!!collateralAmount && !!debtAmount) || debt > 0 || newDebt > 0;
    const riskColor = !isFormFilled ? 'mainTextColor' : getRiskColor(newPerc);

    return <F2MarketContext.Provider 
    value={{
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
        newTotalDebt,
        newCreditLeft,
        maxBorrowable,
        newDBRExpiryDate,
        setStep,
        handleStepChange,
        handleDurationChange,
        handleDebtChange,
        handleCollateralChange,
    }}
    {...props}
    />
}