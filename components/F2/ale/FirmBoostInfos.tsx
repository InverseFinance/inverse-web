import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Stack, InputGroup, InputRightElement, InputLeftElement, useDisclosure, SkeletonText } from '@chakra-ui/react'

import { useContext, useEffect, useMemo, useState } from 'react'
import { getNumberToBn, shortenNumber, smartShortNumber } from '@app/util/markets'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { Input } from '@app/components/common/Input'
import { F2MarketContext } from '../F2Contex'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { F2Market } from '@app/types'
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
        return getSteps(market, deposits, debt, perc, type, _leverageLevel, aleSlippage, [...steps, _leverageLevel], newDebtSigned <= 0 && Math.abs(newDebtSigned) >= debt * (parseFloat(aleSlippage) / 100));
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
    leverageLevel,
    market,
    isUp,
    deposits,
    initialDeposit,    
    dolaPrice = 1,
    aleSlippage,
    viaInput = false,
    dolaInput,
    underlyingExRate = 1,
}) => {
    // only when there is a transformation needed when using ALE, otherwise the underlyingExRate is just a ui info
    const exRate = market?.aleData?.buySellToken?.toLowerCase() !== market?.collateral?.toLowerCase() ? underlyingExRate : 1;
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
        // precision is focused on collateral amount, only with 0x api
        if (!viaInput) {
            const amountUp = baseColAmountForLeverage * leverageLevel - baseColAmountForLeverage;
            const { buyAmount } = await getAleSellQuote(DOLA, market.aleData.buySellToken||market.collateral, getNumberToBn(amountUp, market.underlying.decimals).toString(), aleSlippage, true);
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
        const { buyAmount, validationErrors, msg } = await getAleSellQuote(market.aleData.buySellToken||market.collateral, DOLA, borrowStringToSign, aleSlippage, true);        
        const errorMsg = validationErrors?.length > 0 ?
            `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
            : msg;
        if (setLeverageLoading) setLeverageLoading(false);  
        return {
            errorMsg,
            dolaAmount: borrowNumToSign,
            collateralAmount: (parseFloat(buyAmount) / exRate) / (10 ** market.underlying.decimals),
        }
    } else {
        // leverage down: dola amount is variable, collateral amount is fixed
        // when deleveraging base is always current deposits
        const baseColAmountForLeverage = deposits;
        const baseWorth = baseColAmountForLeverage * collateralPrice;
        const targetWorth = Math.max(0, baseWorth * (1 / leverageLevel));        
        const targetCollateralBalance = targetWorth / collateralPrice;
        const withdrawAmountToSign = targetCollateralBalance - baseColAmountForLeverage;
        const { buyAmount, validationErrors, msg } = await getAleSellQuote(DOLA, market.aleData.buySellToken||market.collateral, getNumberToBn(Math.abs(withdrawAmountToSign) * exRate, market.underlying.decimals).toString(), aleSlippage, true);
        const errorMsg = validationErrors?.length > 0 ?
            `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
            : msg;
        if (setLeverageLoading) setLeverageLoading(false);        
        return {
            errorMsg,            
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
        deposits,
        debt,
        perc,
        leverage: leverageLevel,
        setLeverage: setLeverageLevel,
        debtAmountNum,
        leverageDebtAmount,
        collateralAmountNum,
        leverageCollateralAmount,
        newPerc,
        aleSlippage,
        setAleSlippage,
        dolaPrice,
        leverageLoading,
        setLeverageLoading,
        isInvPrimeMember,        
        isTriggerLeverageFetch,
        underlyingExRate,
    } = useContext(F2MarketContext);
    const newBorrowLimit = 100 - newPerc;
    const showBorrowLimitTooHighMsg = newBorrowLimit >= 99 && !leverageLoading && !isTriggerLeverageFetch;
    const { isOpen, onOpen, onClose } = useDisclosure();
    const minLeverage = 1;
    // const [leverageLevel, setLeverageLevel] = useState(minLeverage || _leverageLevel);
    const [editLeverageLevel, setEditLeverageLevel] = useState(leverageLevel.toString());    
    const [debounced, setDebounced] = useState(true);
    const [debouncedShowdBorrowLimitMsg, setDebouncedShowdBorrowLimitMsg] = useState(showBorrowLimitTooHighMsg);

    const isLeverageUp = type === 'up';

    useDebouncedEffect(() => {
        setDebounced(!!editLeverageLevel && (!editLeverageLevel.endsWith('.') || editLeverageLevel === '.') && !isNaN(parseFloat(editLeverageLevel)));
    }, [editLeverageLevel], 500);

    useDebouncedEffect(() => {
        setDebouncedShowdBorrowLimitMsg(showBorrowLimitTooHighMsg);
    }, [showBorrowLimitTooHighMsg], 500);

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
        const estimatedDolaRequiredBeforeSlippage = debt * (1 + (parseFloat(aleSlippage) + 2) / 100);
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
        if (v <= 1 || isNaN(v)) return;
        setLeverageLevel(v);
        if (!market.price) return;
        const { dolaAmount, collateralAmount, errorMsg, estimatedPriceImpact } = await getLeverageImpact({
            setLeverageLoading,
            leverageLevel: parseFloat(v),
            market,            
            deposits,
            initialDeposit: collateralAmountNum,
            isUp: isLeverageUp,
            aleSlippage,
            dolaPrice,
            underlyingExRate,
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

    const risk = leverageRelativeToMax <= 0.5 ?
        riskLevels.low : leverageRelativeToMax <= 0.60 ?
            riskLevels.lowMid : leverageRelativeToMax <= 0.70 ?
                riskLevels.mid : leverageRelativeToMax <= 0.80 ?
                    riskLevels.midHigh : riskLevels.high;

    const boostLabel = isLeverageUp ? 'Leverage' : 'Deleverage';

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
                <Text fontWeight="bold" color={riskLevels.safer.color}>
                    No {isLeverageUp ? 'leverage' : 'deleverage'}
                </Text>
                <Text textDecoration="underline" fontWeight="bold" cursor="pointer" color={isLeverageUp ? riskLevels.riskier.color : riskLevels.safer.color} onClick={() => isLeverageUp ? handleLeverageChange(maxLeverage) : handleSellEnough()}>
                    {isLeverageUp ? `Max: x${shortenNumber(maxLeverage, 2)}` : 'Sell enough to repay all (estimate)'}
                </Text>
            </HStack>
            <HStack spacing="1" w='full' alignItems="flex-start">
                <TextInfo message="The quote on 1inch for the trade required to do leverage/deleverage">
                    <Text>Quote:</Text>
                    {
                        leverageLoading || isTriggerLeverageFetch ? <SkeletonText pt="2px" skeletonHeight={3} height={'16px'} width={'90px'} noOfLines={1} />
                            : <Text>{estimatedAmount > 0 && knownFixedAmount > 0 ? `~${preciseCommify(isLeverageUp ? knownFixedAmount / estimatedAmount : estimatedAmount / knownFixedAmount, 2)} DOLA per ${market.underlying.symbol}` : '-'}</Text>
                    }
                </TextInfo>
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
    </Stack>
}