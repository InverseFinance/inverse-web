import { useMediaQuery, FlexProps, useDisclosure } from '@chakra-ui/react'
import { F2Market } from '@app/types'
import { JsonRpcSigner } from '@ethersproject/providers'
import { f2CalcNewHealth, findMaxBorrow, getRiskColor } from '@app/util/f2'
import { useAccountDBR, useAccountDBRMarket, useDBRNeeded, useDBRPrice } from '@app/hooks/useDBR'
import { useEffect, useRef, useState } from 'react'
import { TOKENS } from '@app/variables/tokens'
import { getNetworkConfigConstants } from '@app/util/networks'
import { useWeb3React } from '@web3-react/core'
import { useAccount } from '@app/hooks/misc'
import React from 'react'
import { useDOLABalance } from '@app/hooks/useDOLA'
import useStorage from '@app/hooks/useStorage'
import { gaEvent } from '@app/util/analytics'
import { useDOLAPrice } from '@app/hooks/usePrices'
import { useStakedInFirm } from '@app/hooks/useFirm'
import { INV_STAKERS_ONLY } from '@app/config/features'

const { DOLA } = getNetworkConfigConstants();

const dolaToken = TOKENS[DOLA];

export const F2MarketContext = React.createContext<{
    market: F2Market,
    colDecimals: number,
    account: string,
    escrow: string,
    signer: JsonRpcSigner,
    duration: number,
    collateralAmount: string,
    debtAmount: string,
    collateralAmountNum: number,
    debtAmountNum: number,
    dbrPriceUsd: number,
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
    ...props
}: {
    market: F2Market
} & Partial<FlexProps>) => {
    const { provider } = useWeb3React();
    const account = useAccount();
    const [duration, setDuration] = useState(365);
    const [durationType, setDurationType] = useState('months');
    const [durationTypedValue, setDurationTypedValue] = useState(12);
    const [collateralAmount, setCollateralAmount] = useState('');
    const [debtAmount, setDebtAmount] = useState('');
    const [leverageCollateralAmount, setLeverageCollateralAmount] = useState('');
    const [leverageDebtAmount, setLeverageDebtAmount] = useState('');
    const [leveragePriceImpact, setLeveragePriceImpact] = useState('');
    const [dbrSellAmount, setDbrSellAmount] = useState('');
    const [dbrBuySlippage, setDbrBuySlippage] = useState('1');
    const [aleSlippage, setAleSlippage] = useState('1');
    const [isDeposit, setIsDeposit] = useState(true);
    const [isAutoDBR, setIsAutoDBR] = useState(false);
    const [isUseNativeCoin, setIsUseNativeCoin] = useState(false);
    const [needRefreshRewards, setNeedRefreshRewards] = useState(true);
    const [useLeverage, setUseLeverage] = useState(false);
    const [leverage, setLeverage] = useState(1);
    const [leverageLoading, setLeverageLoading] = useState(false);
    const [mode, setMode] = useState('Deposit & Borrow');
    
    const [infoTab, setInfoTab] = useState('Summary');
    const [maxBorrowable, setMaxBorrowable] = useState(0);
    // increment on successful firm tx
    const { value: cachedFirmActionIndex, setter: setCachedFirmActionIndex } = useStorage('firm-action-index');    
    const [firmActionIndex, setFirmActionIndex] = useState(cachedFirmActionIndex === undefined ? null : cachedFirmActionIndex||0);    
    const [isSmallerThan728] = useMediaQuery('(max-width: 728px)');
    const { isInvPrimeMember } = useStakedInFirm(account);

    const isMountedRef = useRef(true)
    const firstTimeModalResolverRef = useRef(() => {});
    const { isOpen: isFirstTimeModalOpen, onOpen: onFirstTimeModalOpen, onClose: onFirstTimeModalClose } = useDisclosure();
    const { isOpen: isFirmLeverageEngineOpen, onOpen: onFirmLeverageEngineOpen, onClose: onFirmLeverageEngineClose } = useDisclosure();
    const { isOpen: isDbrV1NewBorrowIssueModalOpen, onOpen: onDbrV1NewBorrowIssueModalOpen, onClose: onDbrV1NewBorrowIssueModalClose } = useDisclosure();
    const { value: notFirstTime, setter: setNotFirstTime } = useStorage('firm-first-time-modal-no-more');
    const colDecimals = market.underlying.decimals;

    const { deposits, bnDeposits, debt, bnWithdrawalLimit, perc, bnDolaLiquidity, bnCollateralBalance, collateralBalance, bnDebt, bnLeftToBorrow, leftToBorrow, liquidationPrice, escrow, underlyingExRate } = useAccountDBRMarket(market, account, isUseNativeCoin);
    const { balance: dolaBalance, bnBalance: bnDolaBalance } = useDOLABalance(account);
    const { price: dolaPrice, isLoading: isDolaPriceLoading } = useDOLAPrice();

    // if true and leverage switched is enabled, the user will see the INV prime msg
    const userNotEligibleForLeverage = !isInvPrimeMember && INV_STAKERS_ONLY.firmLeverage;
    // if true, the leverage UI will show and leverage is relevant to the mode
    const useLeverageInMode = useLeverage && !userNotEligibleForLeverage && (mode === 'Deposit & Borrow' || (mode === 'Borrow' && deposits > 0) || (['Repay & Withdraw', 'Repay'].includes(mode) && debt > 1))

    const debtAmountNum = parseFloat(debtAmount || '0') || 0;// NaN => 0
    const collateralAmountNum = parseFloat(collateralAmount || '0') || 0;

    const leverageDebtAmountNum = parseFloat(leverageDebtAmount || '0') || 0;// NaN => 0
    const leverageCollateralAmountNum = parseFloat(leverageCollateralAmount || '0') || 0;

    const totalDebtAmountNum = debtAmountNum + (useLeverageInMode ? leverageDebtAmountNum * (1-parseFloat(aleSlippage)/100) : 0);
    const totalCollateralAmountNum = (!(useLeverageInMode && mode === 'Borrow') ? collateralAmountNum : 0) + (isDeposit && useLeverageInMode ? leverageCollateralAmountNum : 0)//(isDeposit || !useLeverageInMode || (!isDeposit && useLeverageInMode) ? collateralAmountNum : 0) + (useLeverageInMode ? leverageCollateralAmountNum : 0);    

    const dbrApproxData = useDBRNeeded(debtAmount, duration);

    const dbrCover = totalDebtAmountNum > 0 ? isAutoDBR ? dbrApproxData.dbrNeededNum : debtAmountNum / (365 / duration) : 0;
    const { priceDola: dbrPriceInDola, priceUsd: dbrPriceUsd } = useDBRPrice();
    const autoDbrSwapPrice = isAutoDBR && !dbrApproxData?.isLoading ? dbrApproxData?.dolaForDbrNum/dbrApproxData?.dbrNeededNum : dbrPriceInDola;    
    const dbrSwapPrice = isAutoDBR ? autoDbrSwapPrice || dbrPriceInDola : dbrPriceInDola;
    const dbrCoverDebt = dbrCover * dbrSwapPrice;

    const hasCollateralChange = ['deposit', 'd&b', 'withdraw', 'r&w'].includes(MODES[mode]) || useLeverageInMode;
    const hasDebtChange = ['borrow', 'd&b', 'repay', 'r&w'].includes(MODES[mode]) || useLeverageInMode;

    const deltaCollateral = isDeposit ? totalCollateralAmountNum : -totalCollateralAmountNum;    
    const deltaDebt = isDeposit ? totalDebtAmountNum : -totalDebtAmountNum;

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
        newPerc, newDeposits, newLiquidationPrice, newCreditLimit, newCreditLeft, newDebt: newTotalDebtInMarket,
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
        hasDebtChange ? isDeposit ? 0 : -(Math.min(totalDebtAmountNum, debt)) : 0,
        perc,
    );

    const { signedBalance: dbrBalance, bnBalance: bnDbrBalance, dbrExpiryDate, debt: currentTotalDebt, hasDbrV1NewBorrowIssue } = useAccountDBR(account);
    // in sellAndRepay case, dbr worth is sent as DOLA to the borrower (not used to repay debt)
    const newTotalDebt = currentTotalDebt + (isDeposit && isAutoDBR && hasDebtChange ? dbrCoverDebt : 0) + deltaDebt;
    // burn rate and fictional "depletion date" in the market
    const { dbrExpiryDate: newDBRExpiryDateInMarket, dailyDebtAccrual: newDailyDBRBurnInMarket } = useAccountDBR(account, newTotalDebtInMarket, isAutoDBR ? isDeposit ? dbrCover : -parseFloat(dbrSellAmount||'0') : 0);
    // global dbr burn rate and new global "depletion date"
    const { dbrExpiryDate: newDBRExpiryDate, dailyDebtAccrual: newDailyDBRBurn } = useAccountDBR(account, newTotalDebt, isAutoDBR ? isDeposit ? dbrCover : -parseFloat(dbrSellAmount||'0') : 0);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        setFirmActionIndex(cachedFirmActionIndex === undefined ? null : cachedFirmActionIndex||0);
    }, [cachedFirmActionIndex]);

    useEffect(() => {
        const init = async () => {
            const newMaxBorrowable = await findMaxBorrow(
                market,
                deposits,
                debt,
                dbrPriceInDola,
                duration,
                deltaCollateral,
                isDeposit ? 0 : -totalDebtAmountNum,
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
    }, [market, deposits, debt, debtAmountNum, totalDebtAmountNum, dbrPriceInDola, deltaCollateral, duration, collateralAmount, maxBorrow, perc, isDeposit, isAutoDBR]);

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

    const isFormFilled = (!!collateralAmount && !!debtAmount) || debt > 0 || newDebt > 0;
    const riskColor = !isFormFilled ? 'mainTextColor' : getRiskColor(newPerc);

    return <F2MarketContext.Provider
        value={{
            market,
            colDecimals,
            account,
            signer: provider?.getSigner(),
            duration,
            collateralAmount,
            debtAmount,
            debtAmountNum,
            collateralAmountNum,
            deltaCollateral,
            deltaDebt,
            dbrPriceUsd,
            dbrPriceInDola,
            dbrSwapPrice,
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
            newTotalDebtInMarket,
            newCreditLeft,
            // 100% max
            maxBorrow,
            // 99% max
            maxBorrowable,
            newDBRExpiryDate,
            newDBRExpiryDateInMarket,
            dbrExpiryDate,
            isAutoDBR,
            isUseNativeCoin,
            isDbrApproxLoading: dbrApproxData?.isLoading,
            dbrBalance,
            bnDbrBalance,
            mode,
            newDailyDBRBurn,
            newDailyDBRBurnInMarket,
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
            dbrBuySlippage,
            needRefreshRewards,
            dbrApproxData,
            useLeverage,
            useLeverageInMode,
            setUseLeverage,
            leverage,
            setLeverage,
            hasDbrV1NewBorrowIssue,
            underlyingExRate,
            totalCollateralAmountNum,
            setAleSlippage,
            aleSlippage,
            dolaPrice,
            setNeedRefreshRewards,
            setDbrBuySlippage,
            setDbrSellAmount,
            setInfoTab,
            setMode,
            setIsAutoDBR,
            setIsUseNativeCoin,
            setIsDeposit,
            handleDurationChange,
            handleDebtChange,
            handleCollateralChange,
            notFirstTime,
            setNotFirstTime,
            isFirmLeverageEngineOpen,
            onFirmLeverageEngineOpen,
            onFirmLeverageEngineClose,
            setLeverageCollateralAmount,
            leverageCollateralAmount,
            leverageCollateralAmountNum,
            leverageDebtAmount,
            setLeverageDebtAmount,
            leverageDebtAmountNum,
            leverageLoading,
            setLeverageLoading,
            leveragePriceImpact,
            setLeveragePriceImpact,
            isFirstTimeModalOpen,
            firmActionIndex,
            setFirmActionIndex,
            setCachedFirmActionIndex,
            onFirstTimeModalOpen: async () => {
                gaEvent({ action: 'FiRM-first-time-modal-open' });
                onFirstTimeModalOpen();
                return new Promise((res) => {
                    firstTimeModalResolverRef.current = res;                                     
                });
            },            
            onFirstTimeModalClose,
            firstTimeModalResolverRef,
            isDbrV1NewBorrowIssueModalOpen,
            isInvPrimeMember,
            userNotEligibleForLeverage,
            onDbrV1NewBorrowIssueModalOpen: () => {
                gaEvent({ action: 'FiRM-dbrv1-issue-modal-open' });
                onDbrV1NewBorrowIssueModalOpen();
            },
            onDbrV1NewBorrowIssueModalClose,
        }}
        {...props}
    />
}