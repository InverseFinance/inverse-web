import { useMediaQuery, FlexProps } from '@chakra-ui/react'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, findMaxBorrow, getRiskColor } from '@app/util/f2'
import { useAccountDBR, useAccountDBRMarket, useDBRPrice } from '@app/hooks/useDBR'
import { useEffect, useRef, useState } from 'react'
import { TOKENS } from '@app/variables/tokens'
import { getNetworkConfigConstants } from '@app/util/networks'

import { useWeb3React } from '@web3-react/core'
import { useAccount } from '@app/hooks/misc'
import React from 'react'
import { useRouter } from 'next/router'
import { useDOLABalance } from '@app/hooks/useDOLA'

const { DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const F2MarketContext = React.createContext<{
    market: F2Market,
    colDecimals: number,
    account: string,
    signer: JsonRpcSigner,
    step: number,
    duration: number,
    collateralAmount: string,
    debtAmount: string,
    collateralAmountNum: number,
    debtAmountNum: number,
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
    const [step, setStep] = useState(1);
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(12);
    const [collateralAmount, setCollateralAmount] = useState('');
    const [debtAmount, setDebtAmount] = useState('');
    const [dbrSellAmount, setDbrSellAmount] = useState('');
    const [isDeposit, setIsDeposit] = useState(true);
    const [isAutoDBR, setIsAutoDBR] = useState(false);
    const [isUseNativeCoin, setIsUseNativeCoin] = useState(false);
    const [mode, setMode] = useState('Deposit & Borrow');
    const [infoTab, setInfoTab] = useState('Summary');
    const [maxBorrowable, setMaxBorrowable] = useState(0);
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { price: dbrPrice } = useDBRPrice();
    const isMountedRef = useRef(true)
    const colDecimals = market.underlying.decimals;

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance, bnDebt, bnLeftToBorrow, leftToBorrow, liquidationPrice, escrow } = useAccountDBRMarket(market, account);
    const { balance: dolaBalance, bnBalance: bnDolaBalance } = useDOLABalance(account);

    const debtAmountNum = parseFloat(debtAmount || '0') || 0;// NaN => 0
    const collateralAmountNum = parseFloat(collateralAmount || '0') || 0;

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

    const { signedBalance: dbrBalance, bnBalance: bnDbrBalance } = useAccountDBR(account);
    const { dbrExpiryDate: newDBRExpiryDate, dailyDebtAccrual: newDailyDBRBurn } = useAccountDBR(account, newTotalDebt, isAutoDBR ? isDeposit ? dbrCover : -parseFloat(dbrSellAmount||'0') : 0);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

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
            if (!isMountedRef.current) {
                return
            }
            setMaxBorrowable(newMaxBorrowable);
        }
        init();
    }, [market, deposits, debt, debtAmountNum, dbrPrice, deltaCollateral, duration, collateralAmount, maxBorrow, perc, isDeposit, isAutoDBR]);

    const handleCollateralChange = (stringNumber: string) => {
        setCollateralAmount(stringNumber);
    }

    const handleDebtChange = (stringNumber: string) => {
        setDebtAmount(stringNumber);
    }

    const handleDurationChange = (duration: number, typedValue: number, type: string) => {
        setDurationTypedValue(typedValue);
        setDurationType(type);
        setDuration(duration);
    }

    const handleStepChange = (newStep: number) => {
        router.push({ hash: `step${newStep}`, query: { ...router.query } });
    }

    useEffect(() => {
        const stepString = location.hash.replace(/#step/, '');

        const hasStep = location.hash.indexOf('step') !== -1;
        setIsWalkthrough(hasStep)
        if (!hasStep) {
            return
        }
        setIsAutoDBR(true);
        if (mode !== 'Deposit & Borrow') {
            handleDebtChange('');
            setMode('Deposit & Borrow');
            // setIsAutoDBR(true);
        }
        if (!collateralAmount && parseInt(stepString) !== 1) {
            setStep(1);
            router.replace({ hash: `step1` });
        } else {
            if (stepString && !isNaN(parseInt(stepString))) {
                setStep(parseInt(stepString));
            } else if (step !== 1) {
                setStep(1);
            }
        }
    }, [router, collateralAmount, mode])

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
            debtAmountNum,
            collateralAmountNum,
            deltaCollateral,
            deltaDebt,
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
            // 100% max
            maxBorrow,
            // 99% max
            maxBorrowable,
            newDBRExpiryDate,
            isAutoDBR,
            isUseNativeCoin,
            dbrBalance,
            bnDbrBalance,
            mode,
            newDailyDBRBurn,
            isWalkthrough,
            infoTab,
            liquidationPrice,
            perc,
            borrowLimit: 100 - perc,
            newBorrowLimit: 100 - newPerc,
            dolaBalance,
            bnDolaBalance,
            isWethMarket: market.underlying.symbol === 'WETH',
            dbrSellAmount,
            escrow,
            setDbrSellAmount,
            setInfoTab,
            setIsWalkthrough,
            setMode,
            setIsAutoDBR,
            setIsUseNativeCoin,
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