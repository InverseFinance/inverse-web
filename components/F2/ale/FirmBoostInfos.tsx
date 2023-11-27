import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Stack, InputGroup, InputRightElement, InputLeftElement, useDisclosure } from '@chakra-ui/react'

import { useContext, useEffect, useMemo, useState } from 'react'
import { getNumberToBn, shortenNumber, smartShortNumber } from '@app/util/markets'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { Input } from '@app/components/common/Input'
import { F2MarketContext } from '../F2Contex'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { F2Market } from '@app/types'
import { useAccountDBR } from '@app/hooks/useDBR'
import { AnchorPoolInfo } from '@app/components/Anchor/AnchorPoolnfo'
import { TextInfo, TextInfoSimple } from '@app/components/common/Messages/TextInfo'
import { getNetworkConfigConstants } from '@app/util/networks'
import { showToast } from '@app/util/notify'
import { INV_STAKERS_ONLY } from '@app/config/features'
import { InvPrime } from '@app/components/common/InvPrime'
import { AboutAleModal } from '../Modals/AboutAleModal'
import { getAleSellQuote } from '@app/util/firm-ale'
import { preciseCommify } from '@app/util/misc'
import { formatUnits, parseUnits } from '@ethersproject/units'

const { DOLA } = getNetworkConfigConstants();

const roundDown = (v: number) => Math.floor(v * 100) / 100;
const roundUp = (v: number) => Math.ceil(v * 100) / 100;
let timeout = -1;

const getSteps = (
    market: F2Market,
    deposits: number,
    debt: number,
    perc: number,
    type: string,
    leverageLevel: number,
    aleSlippage: string,
    steps: number[] = [],    
    doLastOne = false,
): number[] => {
    const isLeverageUp = type === 'up';
    const baseWorth = market.price ? deposits * market.price : 0;    
    const _leverageLevel = leverageLevel + 0.01;
    const effectiveLeverage = isLeverageUp ? _leverageLevel : (1 / _leverageLevel);
    const desiredWorth = baseWorth * effectiveLeverage;

    const deltaBorrow = desiredWorth - baseWorth;
    const collateralPrice = market.price;
    const targetCollateralBalance = collateralPrice ? desiredWorth / collateralPrice : 0;

    const {
        newDebt,
        newDebtSigned,
        newPerc,
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        targetCollateralBalance - deposits,
        deltaBorrow,
        perc,
    );
    if ((newPerc <= 2) || _leverageLevel > 10 || doLastOne) {
        return steps;
    } else {
        return getSteps(market, deposits, debt, perc, type, _leverageLevel, aleSlippage, [...steps, _leverageLevel], newDebtSigned <= 0 && Math.abs(newDebtSigned) >= debt * (parseFloat(aleSlippage)/100));
    }
}

const riskLevels = {
    'safer': { color: 'blue.500', text: 'Safer' },
    'low': { color: 'blue.500', text: 'Safer' },
    'lowMid': { color: 'yellow.500', text: 'Safer' },
    'mid': { color: 'orange.500', text: 'Riskier' },
    'midHigh': { color: 'tomato', text: 'Riskier' },
    'high': { color: 'red.500', text: 'Risky' },
    'riskier': { color: 'red.500', text: 'Riskier' },
}

export const getLeverageImpact = async ({
    setLeverageLoading,
    setLeveragePriceImpact,
    leverageLevel,
    market,
    isUp,
    deposits,
    initialDeposit,
    debt,
    dolaPrice = 1,
    aleSlippage,
    viaInput = false,
    dolaInput,
}) => {
    const collateralPrice = market?.price;
    if (!collateralPrice || leverageLevel <= 1) {
        return
    }
    if (setLeverageLoading) {
        setLeverageLoading(true);
    }
    if (isUp) {
        // leverage up: dola amount is fixed, collateral amount is variable
        // if already has deposits, base is deposits, if not (=depositAndLeverage case), base is initialDeposit
        const baseColAmountForLeverage = deposits > 0 ? deposits : initialDeposit;
        const baseWorth = baseColAmountForLeverage * collateralPrice;
        let borrowStringToSign, borrowNumToSign;        
        // precision is focused on collateral amount, only with 0x
        if (!viaInput) {
            const amountUp = deposits * leverageLevel - deposits;            
            const { buyAmount } = await getAleSellQuote(DOLA, market.collateral, getNumberToBn(amountUp, market.underlying.decimals).toString(), aleSlippage, true);
            borrowStringToSign = buyAmount;
            borrowNumToSign = parseFloat(borrowStringToSign) / (1e18);
        } 
        else if (!!dolaInput) {
            borrowNumToSign = parseFloat(dolaInput);
            borrowStringToSign = getNumberToBn(borrowNumToSign).toString();
        } else {
            const targetWorth = baseWorth * leverageLevel;
            borrowNumToSign = (targetWorth - baseWorth) * dolaPrice;
            borrowStringToSign = getNumberToBn(borrowNumToSign).toString();
        }

        // in the end the reference is always a number of dola sold (as it's what we need to sign, or part of it if with dbr)
        const { buyAmount, validationErrors, msg } = await getAleSellQuote(market.collateral, DOLA, borrowStringToSign, aleSlippage, true);
        const errorMsg = validationErrors?.length > 0 ?
            `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
            : msg;
        if (setLeverageLoading) setLeverageLoading(false);
        // if (setLeveragePriceImpact) setLeveragePriceImpact(estimatedPriceImpact);
        return {
            errorMsg,
            dolaAmount: borrowNumToSign,
            collateralAmount: parseFloat(buyAmount) / (10 ** market.underlying.decimals),
        }
    } else {
        // leverage down: dola amount is variable, collateral amount is fixed
        // when deleveraging base is always current deposits
        const baseColAmountForLeverage = deposits;
        const baseWorth = baseColAmountForLeverage * collateralPrice;
        const targetWorth = Math.max(0, baseWorth * (1 / leverageLevel));
        // const estimatedRepayAmount = (baseWorth - targetWorth);
        const targetCollateralBalance = targetWorth / collateralPrice;
        const withdrawAmountToSign = targetCollateralBalance - baseColAmountForLeverage;
        const { buyAmount, validationErrors, msg } = await getAleSellQuote(DOLA, market.collateral, getNumberToBn(Math.abs(withdrawAmountToSign), market.underlying.decimals).toString(), aleSlippage, true);
        const errorMsg = validationErrors?.length > 0 ?
            `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
            : msg;
        if (setLeverageLoading) setLeverageLoading(false);
        // if (setLeveragePriceImpact) setLeveragePriceImpact(estimatedPriceImpact);
        return {
            errorMsg,
            // dolaAmount: estimatedRepayAmount,
            dolaAmount: parseFloat(buyAmount) / 1e18,
            collateralAmount: withdrawAmountToSign,
        }
    }
}

export const FirmBoostInfos = ({
    type = 'up',
    onLeverageChange,
    triggerCollateralAndOrLeverageChange,
}: {
    type?: 'up' | 'down',
    onLeverageChange: ({ }) => void
    triggerCollateralAndOrLeverageChange,
}) => {
    const {
        market,
        dbrPrice,
        deposits,
        debt,
        perc,
        borrowLimit,
        liquidationPrice,
        account,
        leverage: leverageLevel,
        setLeverage: setLeverageLevel,
        debtAmountNum,
        leverageDebtAmount,
        collateralAmountNum,
        onFirmLeverageEngineOpen,
        handleDebtChange,
        leverageCollateralAmount,
        leverageCollateralAmountNum,
        setLeverageCollateralAmount,

        newDebt,
        newPerc,
        newLiquidationPrice,
        newTotalDebt,
        aleSlippage,
        setAleSlippage,
        dolaPrice,
        leverageLoading,
        setLeverageLoading,
        isInvPrimeMember,
        setLeveragePriceImpact,
        useLeverageInMode,
    } = useContext(F2MarketContext);
    const newBorrowLimit = 100 - newPerc;
    const showBorrowLimitTooHighMsg = newBorrowLimit >= 99 && !leverageLoading;
    const { isOpen, onOpen, onClose } = useDisclosure();    
    const minLeverage = 1;
    // const [leverageLevel, setLeverageLevel] = useState(minLeverage || _leverageLevel);
    const [editLeverageLevel, setEditLeverageLevel] = useState(leverageLevel.toString());
    const [sliderLeverageLevel, setSliderLeverageLevel] = useState(leverageLevel.toString());
    const [debounced, setDebounced] = useState(true);
    const [debouncedShowdBorrowLimitMsg, setDebouncedShowdBorrowLimitMsg] = useState(showBorrowLimitTooHighMsg);

    // const borrowApy = dbrPrice * 100;
    // const boostedApy = (leverageLevel * (market.supplyApy || 0) / 100 - (leverageLevel - 1) * (borrowApy) / 100) * 100;
    // const boostedApyLow = (leverageLevel * (market.supplyApyLow || 0));
    // const boostedSupplyApy = (leverageLevel * (market.supplyApy || 0));
    // const boostedExtraApy = (leverageLevel * (market.extraApy || 0));

    const isLeverageUp = type === 'up';

    // const apyInfos = <AnchorPoolInfo
    //     value={market.supplyApy}
    //     valueExtra={market.extraApy}
    //     valueLow={market.supplyApyLow}
    //     priceUsd={market.price}
    //     symbol={market.underlying.symbol}
    //     type={'supply'}
    //     textProps={{ textAlign: "end", fontWeight: "bold" }}
    //     hasClaimableRewards={market.hasClaimableRewards}
    // />;

    // const newApyInfos = <AnchorPoolInfo
    //     value={boostedSupplyApy}
    //     valueExtra={boostedExtraApy}
    //     valueLow={boostedApyLow}
    //     priceUsd={market.price}
    //     symbol={market.underlying.symbol}
    //     type={'supply'}
    //     textProps={{ textAlign: "end", fontWeight: "bold" }}
    //     hasClaimableRewards={market.hasClaimableRewards}
    // />;

    useDebouncedEffect(() => {
        setDebounced(!!editLeverageLevel && (!editLeverageLevel.endsWith('.') || editLeverageLevel === '.') && !isNaN(parseFloat(editLeverageLevel)));
    }, [editLeverageLevel], 500);    
    
    useDebouncedEffect(() => {
        setDebouncedShowdBorrowLimitMsg(showBorrowLimitTooHighMsg);
    }, [showBorrowLimitTooHighMsg], 500);

    // useDebouncedEffect(() => {
    //     if(!useLeverageInMode) return;
    //     console.warn('useDebouncedEffect')
    //     setDebounced(false);
    //     validatePendingLeverage(sliderLeverageLevel, isLeverageUp);
    // }, [sliderLeverageLevel, isLeverageUp, useLeverageInMode], 500);

    useEffect(() => {
        setEditLeverageLevel(leverageLevel.toFixed(2));        
    }, [leverageLevel])

    if (!market?.underlying) {
        return <></>
    }

    const handleEditLeverage = (value: string) => {
        setDebounced(false);
        const stringAmount = value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1');
        setEditLeverageLevel(stringAmount);
    }

    const handleSliderLeverage = (value: string, isLeverageUp: boolean) => {
        setDebounced(false);
        setLeverageLevel(value);
        setSliderLeverageLevel(value);

        const debouncedAction = () => {
            validatePendingLeverage(value, isLeverageUp);
        }

        if (timeout !== -1) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            debouncedAction();
        }, 500);
    }

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            validatePendingLeverage(editLeverageLevel, isLeverageUp);
        }
    }

    const handleSellEnough = async () => {
        if (!market.price) return;
        setLeverageLoading(true);
        const estimatedDolaRequiredBeforeSlippage = debt * (1+(parseFloat(aleSlippage)+2)/100);
        const estimatedResult = await getAleSellQuote(market.collateral, DOLA, getNumberToBn(estimatedDolaRequiredBeforeSlippage).toString(), aleSlippage, true);        

        if (!estimatedResult?.buyAmount) {
            showToast({ status: 'warning', title: 'Could not estimate amount to sell to repay all' });
            return
        }
        const estimatedCollateralAmountToSell = formatUnits(parseUnits(estimatedResult?.buyAmount, '0'), market.underlying.decimals);
        triggerCollateralAndOrLeverageChange(estimatedCollateralAmountToSell, parseFloat(estimatedCollateralAmountToSell));
    }

    const handleLeverageChange = async (v: number) => {        
        setDebounced(false);
        if(v <= 1 || isNaN(v)) return;
        setLeverageLevel(v);
        if (!market.price) return;
        const { dolaAmount, collateralAmount, errorMsg, estimatedPriceImpact } = await getLeverageImpact({
            setLeverageLoading,
            leverageLevel: parseFloat(v),
            market,
            debt,
            deposits,
            initialDeposit: collateralAmountNum,
            isUp: isLeverageUp,
            aleSlippage,
            dolaPrice,
            setLeveragePriceImpact,
        });

        if (!!errorMsg) {
            showToast({ status: 'warning', description: errorMsg, title: 'Could not fetch swap data' })
            return
        }
        onLeverageChange({
            dolaAmount,
            collateralAmount,
            isLeverageUp,
            estimatedPriceImpact,
        })
    }

    const isInvalidLeverage = (input: number, isLeverageUp: boolean) => {
        return !input || isNaN(input) || input < minLeverage || (isLeverageUp && input > maxLeverage);
    }

    const validatePendingLeverage = (v: string, isLeverageUp: boolean) => {
        const input = parseFloat(v);
        if (isInvalidLeverage(input, isLeverageUp)) {
            return;
        }
        handleLeverageChange(input);
    }    
    
    const baseColAmountForLeverage = deposits > 0 ? deposits : collateralAmountNum;
    const leverageSteps = useMemo(() => getSteps(market, baseColAmountForLeverage, debt, perc, type, 1, aleSlippage, []), [market, baseColAmountForLeverage, debt, perc, type, undefined, aleSlippage]);
    // when deleveraging we want the max to be higher what's required to repay all debt, the extra dola is sent to the wallet
    const maxLeverage = isLeverageUp ? roundDown(leverageSteps[leverageSteps.length - 1]) : roundUp(leverageSteps[leverageSteps.length - 1]);
    const leverageRelativeToMax = leverageLevel / maxLeverage;

    // const { dbrExpiryDate, debt: currentTotalDebt } = useAccountDBR(account);
    // const newTotalDebt = currentTotalDebt + deltaBorrow;
    // const { dbrExpiryDate: newDBRExpiryDate, dailyDebtAccrual: newDailyDBRBurn } = useAccountDBR(account, newTotalDebt);

    const risk = leverageRelativeToMax <= 0.5 ?
        riskLevels.low : leverageRelativeToMax <= 0.60 ?
            riskLevels.lowMid : leverageRelativeToMax <= 0.70 ?
                riskLevels.mid : leverageRelativeToMax <= 0.80 ?
                    riskLevels.midHigh : riskLevels.high;

    const currentRiskColor = getRiskColor(perc);
    const newRiskColor = getRiskColor(newPerc);

    const boostLabel = isLeverageUp ? 'Leverage' : 'Deleverage';
    const now = Date.now();

    if (!isInvPrimeMember && INV_STAKERS_ONLY.firmLeverage) {
        return <InvPrime showLinks={false} />
    } else if (isLeverageUp && market.leftToBorrow < 1) {
        return <InfoMessage alertProps={{ w: 'full' }} description="Cannot use leverage when there is no DOLA liquidity" />
    }

    const editLeverageIsInvalid = isInvalidLeverage(parseFloat(editLeverageLevel), isLeverageUp);
    const knownFixedAmount = isLeverageUp ? debtAmountNum : collateralAmountNum;
    const aleSlippageFactor = (1 - parseFloat(aleSlippage) / 100);
    const estimatedAmount = leverageLevel > 1 ? parseFloat(isLeverageUp ? leverageCollateralAmount : leverageDebtAmount) : 0;
    const minAmount = aleSlippage ? aleSlippageFactor * estimatedAmount : 0;
    // when leveraging down min amount (or debt) is always the amount repaid, the slippage impacts amount of dola received in wallet
    const amountOfDebtReduced = !isLeverageUp ? Math.min(minAmount, debt) : 0;
    const extraDolaReceivedInWallet = isLeverageUp ? 0 : estimatedAmount - amountOfDebtReduced;

    return <Stack fontSize="14px" spacing="4" w='full' direction={{ base: 'column', lg: 'row' }} justify="space-between" alignItems="center">
        <VStack position="relative" w='full' alignItems="center" justify="center">
            <HStack spacing="8" w='full' justify="space-between" alignItems="center">
                <InputGroup
                    w='fit-content'
                    alignItems="center"
                >
                    <InputLeftElement
                        children={<Text cursor="text" as="label" for="boostInput" color="secondaryTextColor" whiteSpace="nowrap" transform="translateX(60px)" fontSize="20px" fontWeight="extrabold">
                            {boostLabel}:
                        </Text>}
                    />                    
                    <Input _focusVisible={false} isInvalid={editLeverageIsInvalid} autocomplete="off" onKeyPress={handleKeyPress} id="boostInput" color={risk.color} py="0" pl="60px" onChange={(e) => handleEditLeverage(e.target.value, minLeverage, maxLeverage)} width="220px" value={editLeverageLevel} min={minLeverage} max={maxLeverage} />
                    {
                        editLeverageLevel !== leverageLevel.toFixed(2) && debounced && !editLeverageIsInvalid &&
                        <InputRightElement cursor="pointer" transform="translateX(40px)" onClick={() => validatePendingLeverage(editLeverageLevel, isLeverageUp)}
                            children={<CheckCircleIcon transition="ease-in-out" transitionDuration="300ms" transitionProperty="color" _hover={{ color: 'success' }} />}
                        />
                    }
                </InputGroup>
                {
                    leverageLoading && <Text fontSize="16px" fontWeight="bold" color="secondaryTextColor">Fetching 1inch swap data...</Text>
                }
                {
                    !leverageLoading && leverageLevel > 1 && <TextInfoSimple direction="row-reverse" message={isLeverageUp ? `Collateral added thanks to leverage` : `Collateral reduced thanks to deleverage`}>
                        <HStack fontWeight="bold" spacing="1" alignItems="center">
                            {isLeverageUp ? <ArrowUpIcon color="success" fontSize="20px" /> : <ArrowDownIcon color="warning" fontSize="20px" />}
                            <VStack spacing="0">
                                <Text textDecoration="underline" cursor="default" w='fit-content' fontSize="15px" textAlign="center">
                                    {isLeverageUp ? '~' : ''}{smartShortNumber(isLeverageUp ? parseFloat(leverageCollateralAmount) : collateralAmountNum, 4)}
                                </Text>
                                <Text textDecoration="underline" cursor="default" fontSize="15px">
                                    {market.underlying.symbol}
                                </Text>
                            </VStack>
                        </HStack>
                    </TextInfoSimple>
                }
                {
                    !leverageLoading && leverageLevel > 1 && <TextInfoSimple direction="row-reverse" message={isLeverageUp ? `Debt added due to leverage` : `Debt reduced via deleveraging, if higher than the current debt the extra DOLA goes to the user wallet`}>
                        <HStack fontWeight="bold" spacing="1" alignItems="center">
                            {isLeverageUp ? <ArrowUpIcon color="warning" fontSize="20px" /> : <ArrowDownIcon color="success" fontSize="20px" />}
                            <VStack spacing="0">
                                <Text textDecoration="underline" cursor="default" w='fit-content' fontSize="15px" textAlign="center">
                                    {smartShortNumber(!isLeverageUp ? amountOfDebtReduced : debtAmountNum, 2)}
                                </Text>
                                <Text textDecoration="underline" cursor="default" fontSize="15px">DEBT</Text>
                            </VStack>
                        </HStack>
                    </TextInfoSimple>
                }
                {
                    !leverageLoading && leverageLevel > 1 && !isLeverageUp && extraDolaReceivedInWallet > 0 && <TextInfoSimple direction="row-reverse" message={"DOLA estimated to be sent to wallet directly, it depends on the difference between min amount to receive from sell and actual amount or amount and debt"}>
                        <HStack fontWeight="bold" spacing="1" alignItems="center">
                            <ArrowUpIcon color="success" fontSize="20px" />
                            <VStack spacing="0">
                                <Text textDecoration="underline" cursor="default" w='fit-content' fontSize="15px" textAlign="center">
                                    ~{smartShortNumber(extraDolaReceivedInWallet, 2)}
                                </Text>
                                <Text textDecoration="underline" cursor="default" fontSize="15px">DOLA</Text>
                            </VStack>
                        </HStack>
                    </TextInfoSimple>
                }
                {/* {
                    market.supplyApy > 0 && <HStack>
                        {newApyInfos}
                    </HStack>
                } */}
                {/* <TextInfo direction="row-reverse" message={isLeverageUp ? `Collateral added thanks to leverage` : `Collateral reduced thanks to deleverage`}>
                    <HStack color="success" fontWeight="bold" spacing="1" alignItems="center">
                        {isLeverageUp ? <ArrowUpIcon /> : <ArrowDownIcon />}
                        <Text>
                            {smartShortNumber(deltaCollateral, 4, false, true)} {market.underlying.symbol}
                        </Text>
                    </HStack>
                </TextInfo> */}
                {/* <Text onClick={() => onFirmLeverageEngineOpen()}>Details</Text> */}
            </HStack>
            <Slider
                value={leverageLevel}
                onChange={(v: number) => handleSliderLeverage(v, isLeverageUp)}
                min={minLeverage}
                max={maxLeverage}
                step={0.01}
                aria-label='slider-ex-4'
                defaultValue={leverageLevel}
                focusThumbOnChange={false}
            >
                <SliderTrack h="10px" bg='red.100'>
                    <SliderFilledTrack bg={risk.color} />
                </SliderTrack>
                <SliderThumb h="20px" w="10px" />
            </Slider>
            <HStack w='full' justify="space-between" alignItems="center">
                <Text textDecoration="underline" fontWeight="bold" cursor="pointer" color={riskLevels.safer.color} onClick={() => handleLeverageChange(minLeverage)}>
                    No {isLeverageUp ? 'leverage' : 'deleverage'}
                </Text>
                <Text textDecoration="underline" fontWeight="bold" cursor="pointer" color={isLeverageUp ? riskLevels.riskier.color : riskLevels.safer.color} onClick={() => isLeverageUp ? handleLeverageChange(maxLeverage) : handleSellEnough()}>
                    {isLeverageUp ? `Max: x${shortenNumber(maxLeverage, 2)}` : 'Sell enough to repay all debt'}
                </Text>
            </HStack>
            <HStack w='full' justify="space-between">
                <TextInfo
                    message="Collateral and DOLA market price can vary, the max. slippage % allows the swap required for leverage to be within a certain range, if out of range, the transaction will revert or fail">
                    <Text>
                        Max. swap slippage for leverage %:
                    </Text>
                </TextInfo>
                <Input py="0" maxH="30px" w='90px' value={aleSlippage} onChange={(e) => setAleSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
            </HStack>
            {
                leverageLevel > 1 && <HStack w='full' justify="space-between">
                    <TextInfo
                        message="This is the minimum amount that you're willing to accept for the trade, if the amount is not within the slippage range the transaction will fail or revert.">
                        <Text>
                            Min. amount swapped for {preciseCommify(knownFixedAmount, 8, false, true)} {!isLeverageUp ? market.underlying.symbol : 'DOLA'}: {preciseCommify(isLeverageUp ? minAmount : amountOfDebtReduced, isLeverageUp ? 6 : 2, false, true)} {isLeverageUp ? market.underlying.symbol : 'DOLA'}
                        </Text>
                    </TextInfo>
                </HStack>
            }
            <AboutAleModal isOpen={isOpen} onClose={onClose} />
            <Text cursor="pointer" w='full' textAlign="left" textDecoration="underline" onClick={onOpen}>
                About the Accelerated Leverage Engine
            </Text>
            {
                debouncedShowdBorrowLimitMsg && <WarningMessage description="New borrow limit would be too high" />
            }
        </VStack>
        {/* {showDetails && <InfoMessage
            alertProps={{ w: { base: 'full', md: '60%' }, p: '4', fontSize: '14px' }}
            showIcon={false}
            description={
                <VStack spacing="2" w='full' alignItems="flex-start" fontSize="18px">
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="Boost achieved thanks to the Accelerated Leverage Engine" />
                            <Text>
                                {capitalize(boostLabel)} to apply:
                            </Text>
                        </HStack>
                        <Text fontWeight="bold" color={risk.color}>
                            x{leverageLevel.toFixed(2)}
                        </Text>
                    </HStack>
                    {
                        isLeverageUp && market.supplyApy > 0 && <HStack w='full' justify="space-between" fontSize='14px'>
                            <HStack>
                                <AnimatedInfoTooltip type="tooltip" message="Effective collateral APR, note: this is supposing the position was not leveraged already before. Does not take into account borrowing costs in DBR." />
                                <Text>
                                    Collateral APR:
                                </Text>
                            </HStack>
                            <HStack>
                                {apyInfos}
                                <Text fontWeight="bold">
                            =>
                                </Text>
                                {newApyInfos}
                            </HStack>
                        </HStack>
                    }
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="Leveraging impacts DBR burn rate and thus DBR depletion date" />
                            <Text>
                                DBR Depletion change:
                            </Text>
                        </HStack>
                        <HStack>
                            <Text fontWeight="bold">
                                {getDepletionDate(dbrExpiryDate, now)}
                            </Text>
                            <Text fontWeight="bold">
                            =>
                            </Text>
                            <Text fontWeight="bold">
                                {getDepletionDate(newDBRExpiryDate, now)}
                            </Text>
                        </HStack>
                    </HStack>
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="The collateral balance in your escrow" />
                            <Text>
                                Collateral change:
                            </Text>
                        </HStack>
                        <HStack>
                            <Text fontWeight="bold">
                                {smartShortNumber(baseColAmountForLeverage, 2)}
                            </Text>
                            <Text fontWeight="bold">
                            =>
                            </Text>
                            <Text fontWeight="bold">
                                {targetCollateralBalance < 0 ? '0' : smartShortNumber(targetCollateralBalance, 2)} {market?.underlying?.symbol}
                            </Text>
                        </HStack>
                    </HStack>
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="Leveraging borrows/repays DOLA to buy/sell the collateral token" />
                            <Text>
                                Debt change:
                            </Text>
                        </HStack>
                        <HStack>
                            <Text fontWeight="bold">
                                {preciseCommify(debt, 2)}
                            </Text>
                            <Text fontWeight="bold">
                            =>
                            </Text>
                            <Text fontWeight="bold">
                                {newDebt < 0 ? '0' : preciseCommify(newDebt, 2)} DOLA
                            </Text>
                        </HStack>
                    </HStack>
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="The higher the boost the higher the liquidation price, if the collateral price is equal or under the liquidation price then the position will be liquidated" />
                            <Text>
                                Liq. Price change:
                            </Text>
                        </HStack>
                        <HStack>
                            <Text fontWeight="bold" color={currentRiskColor}>
                                {preciseCommify(liquidationPrice, 2, true)}
                            </Text>
                            <Text fontWeight="bold">
                            =>
                            </Text>
                            <Text fontWeight="bold" color={newRiskColor}>
                                {newLiquidationPrice < 0 ? 'n/a' : preciseCommify(newLiquidationPrice, 2, true)}
                            </Text>
                        </HStack>
                    </HStack>
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="The Loan-To-Value Ratio is the ratio between the total worth of the position and the loan (DOLA debt), the higher the ratio the higher the risk" />
                            <Text>
                                Borrow Limit change:
                            </Text>
                        </HStack>
                        <HStack>
                            <Text fontWeight="bold" color={currentRiskColor}>
                                {shortenNumber(borrowLimit, 2, false)}%
                            </Text>
                            <Text fontWeight="bold">
                            =>
                            </Text>
                            <Text fontWeight="bold" color={newRiskColor}>
                                {shortenNumber(newBorrowLimit, 2, false)}%
                            </Text>
                        </HStack>
                    </HStack>
                </VStack>
            }
        />} */}
    </Stack>
}