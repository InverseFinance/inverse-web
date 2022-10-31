import { useMediaQuery, FlexProps } from '@chakra-ui/react'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, findMaxBorrow, getRiskColor } from '@app/util/f2'
import { BigNumber } from 'ethers'
import { useAccountDBR, useAccountDBRMarket, useDBRPrice } from '@app/hooks/useDBR'
import { useEffect, useRef, useState } from 'react'
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

const MODES = {
    'Deposit & Borrow': 'd&b',
    'Deposit': 'deposit',
    'Borrow': 'borrow',
    'Repay & Withdraw': 'r&w',
    'Repay': 'repay',
    'Withdraw': 'withdraw',
}

export const F2Context = ({
    market,
    isWalkthrough,
    setIsWalkthrough,
    ...props
}: {
    market: F2Market
    isWalkthrough: boolean
    setIsWalkthrough: (v: boolean) => void
} & Partial<FlexProps>) => {
    const router = useRouter();    
    const { library } = useWeb3React();
    const account = useAccount();
    const [step, setStep] = useState(0);
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(12);
    const [collateralAmount, setCollateralAmount] = useState('');
    const [debtAmount, setDebtAmount] = useState('');
    const [isDeposit, setIsDeposit] = useState(true);
    const [isAutoDBR, setIsAutoDBR] = useState(true);    
    const [mode, setMode] = useState('Deposit & Borrow');
    const [infoTab, setInfoTab] = useState('Summary');
    const [maxBorrowable, setMaxBorrowable] = useState(0);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { price: dbrPrice } = useDBRPrice();
    const isMountedRef = useRef(true)
    const colDecimals = market.underlying.decimals;

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance, bnDebt, bnLeftToBorrow, leftToBorrow } = useAccountDBRMarket(market, account);

    const debtAmountNum = parseFloat(debtAmount||'0');
    const collateralAmountNum = parseFloat(collateralAmount||'0');

    const dbrCover = debtAmountNum / (365 / duration);
    const dbrCoverDebt = debtAmountNum * dbrPrice / (365 / duration);

    const hasCollateralChange = ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]);
    const hasDebtChange = ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]);

    const deltaCollateral = isDeposit ? collateralAmountNum : -collateralAmountNum;
    const deltaDebt = isDeposit ? debtAmountNum : -debtAmountNum;

    const {
        newDebt
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        deltaCollateral,
        deltaDebt,
        perc,
    );

    const {
        newPerc, newDeposits, newLiquidationPrice, newCreditLimit, newCreditLeft, newDebt: newTotalDebt,
    } = f2CalcNewHealth(
        market,
        deposits,
        debt + (isDeposit && isAutoDBR && hasDebtChange ? dbrCoverDebt : 0),
        hasCollateralChange ? deltaCollateral : 0,
        hasDebtChange ? deltaDebt : 0,
        perc,
    );

    const {
        newCreditLeft: maxBorrow
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        hasCollateralChange ? deltaCollateral : 0,
        hasDebtChange ? isDeposit ? 0 : -(Math.min(debtAmountNum, debt)) : 0,
        perc,
    );

    const { signedBalance: dbrBalance } = useAccountDBR(account);
    const { dbrExpiryDate: newDBRExpiryDate, dailyDebtAccrual: newDailyDBRBurn, } = useAccountDBR(account, newTotalDebt, isAutoDBR ? dbrCover : 0);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if(isWalkthrough){
            setIsDeposit(true);
            setIsAutoDBR(true);
            setMode('Deposit & Borrow');
            setStep(1);
        }
    }, [isWalkthrough]);

    useEffect(() => {
        const init = async () => {
            const newMaxBorrowable = await findMaxBorrow(
                market,
                deposits,
                debt,
                dbrPrice,
                duration,
                deltaCollateral,
                isDeposit ? 0 : -debtAmountNum,
                maxBorrow,
                perc,
                isAutoDBR,
            );
            if(!isMountedRef.current) {
                return
            }
            setMaxBorrowable(newMaxBorrowable);
        }
        init();
    }, [market, deposits, debt, debtAmountNum, dbrPrice, deltaCollateral, duration, collateralAmount, maxBorrow, perc, isDeposit, isAutoDBR]);

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
        bnDebt,
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
        bnLeftToBorrow,
        leftToBorrow,
        durationType,
        durationTypedValue,
        riskColor,
        dbrCover,
        newLiquidationPrice,
        newTotalDebt,
        newCreditLeft,
        maxBorrowable,
        newDBRExpiryDate,
        isAutoDBR,
        dbrBalance,
        mode,
        newDailyDBRBurn,
        isWalkthrough,
        infoTab,
        setInfoTab,
        setIsWalkthrough,
        setMode,
        setIsAutoDBR,
        setStep,
        setIsDeposit,
        handleStepChange,
        handleDurationChange,
        handleDebtChange,
        handleCollateralChange,
    }}
    {...props}
    />
}