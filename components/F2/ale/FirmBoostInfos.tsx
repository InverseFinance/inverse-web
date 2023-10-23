import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Stack, InputGroup, InputRightElement, InputLeftElement } from '@chakra-ui/react'

import { useContext, useEffect, useMemo, useState } from 'react'
import { getNumberToBn, shortenNumber, smartShortNumber } from '@app/util/markets'
import { WarningMessage } from '@app/components/common/Messages'
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { Input } from '@app/components/common/Input'
import { F2MarketContext } from '../F2Contex'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { F2Market } from '@app/types'
import { useAccountDBR } from '@app/hooks/useDBR'
import { AnchorPoolInfo } from '@app/components/Anchor/AnchorPoolnfo'
import { TextInfo } from '@app/components/common/Messages/TextInfo'
import { get0xSellQuote } from '@app/util/zero'
import { getNetworkConfigConstants } from '@app/util/networks'
import { showToast } from '@app/util/notify'
import { INV_STAKERS_ONLY } from '@app/config/features'
import { InvPrime } from '@app/components/common/InvPrime'

const { DOLA } = getNetworkConfigConstants();

const getSteps = (
    market: F2Market,
    deposits: number,
    debt: number,
    perc: number,
    type: string,
    leverageLevel: number,
    steps: number[] = [],
    doLastOne = false,
): number[] => {
    const baseWorth = market.price ? deposits * market.price : 0;
    const isLeverageUp = type === 'up';
    const _leverageLevel = leverageLevel + 0.01;
    const effectiveLeverage = isLeverageUp ? _leverageLevel : 1 / _leverageLevel;
    const desiredWorth = baseWorth * effectiveLeverage;

    const deltaBorrow = desiredWorth - baseWorth;
    const collateralPrice = market.price;
    const targetCollateralBalance = collateralPrice ? desiredWorth / collateralPrice : 0;

    const {
        newDebt,
        newPerc,
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        targetCollateralBalance - deposits,
        deltaBorrow,
        perc,
    );
    if ((newPerc <= 1) || _leverageLevel > 10 || doLastOne) {
        return steps;
    } else {
        return getSteps(market, deposits, debt, perc, type, _leverageLevel, [...steps, _leverageLevel], newDebt < 0);
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
    debt,
    dolaPrice = 1,
    aleSlippage,
}) => {
    const collateralPrice = market?.price;
    if (!collateralPrice || leverageLevel <= 1) {
        return
    }
    if (setLeverageLoading) setLeverageLoading(true);
    if (isUp) {
        // leverage up: dola amount is fixed, collateral amount is variable
        // if already has deposits, base is deposits, if not (=depositAndLeverage case), base is initialDeposit
        const baseColAmountForLeverage = deposits > 0 ? deposits : initialDeposit;
        const baseWorth = baseColAmountForLeverage * collateralPrice;
        const targetWorth = baseWorth * leverageLevel;
        const borrowAmountToSign = (targetWorth - baseWorth) * dolaPrice;
        const { buyAmount, validationErrors } = await get0xSellQuote(market.collateral, DOLA, getNumberToBn(borrowAmountToSign).toString(), aleSlippage, true);
        const msg = validationErrors?.length > 0 ?
            `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
            : "Getting a quote from 0x failed";
        // const targetCollateralBalance = targetWorth / collateralPrice;
        // const collateralIncrease = targetCollateralBalance - baseColAmountForLeverage;
        if (setLeverageLoading) setLeverageLoading(false);
        return {
            errorMsg: validationErrors?.length > 0 ? msg : undefined,
            dolaAmount: borrowAmountToSign,
            // collateralAmount: collateralIncrease,
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
        const { buyAmount, validationErrors } = await get0xSellQuote(DOLA, market.collateral, getNumberToBn(Math.abs(withdrawAmountToSign), market.underlying.decimals).toString(), aleSlippage, true);
        const msg = validationErrors?.length > 0 ?
            `Swap validation failed with: ${validationErrors[0].field} ${validationErrors[0].reason}`
            : "Getting a quote from 0x failed";
        if (setLeverageLoading) setLeverageLoading(false);
        return {
            errorMsg: validationErrors?.length > 0 ? msg : undefined,
            // dolaAmount: estimatedRepayAmount,
            dolaAmount: parseFloat(buyAmount) / 1e18,
            collateralAmount: withdrawAmountToSign,
        }
    }
}

export const FirmBoostInfos = ({
    type = 'up',
    onLeverageChange,
    showDetails = false,
}: {
    type?: 'up' | 'down',
    onLeverageChange: ({ }) => void
    showDetails: boolean
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
    } = useContext(F2MarketContext);    

    const borrowApy = dbrPrice * 100;
    const minLeverage = 1;
    // const [leverageLevel, setLeverageLevel] = useState(minLeverage || _leverageLevel);
    const [editLeverageLevel, setEditLeverageLevel] = useState(leverageLevel.toString());
    const [sliderLeverageLevel, setSliderLeverageLevel] = useState(leverageLevel.toString());
    const [debounced, setDebounced] = useState(true);

    const boostedApy = (leverageLevel * (market.supplyApy || 0) / 100 - (leverageLevel - 1) * (borrowApy) / 100) * 100;
    const boostedApyLow = (leverageLevel * (market.supplyApyLow || 0));
    const boostedSupplyApy = (leverageLevel * (market.supplyApy || 0));
    const boostedExtraApy = (leverageLevel * (market.extraApy || 0));

    const apyInfos = <AnchorPoolInfo
        value={market.supplyApy}
        valueExtra={market.extraApy}
        valueLow={market.supplyApyLow}
        priceUsd={market.price}
        symbol={market.underlying.symbol}
        type={'supply'}
        textProps={{ textAlign: "end", fontWeight: "bold" }}
        hasClaimableRewards={market.hasClaimableRewards}
    />;

    const newApyInfos = <AnchorPoolInfo
        value={boostedSupplyApy}
        valueExtra={boostedExtraApy}
        valueLow={boostedApyLow}
        priceUsd={market.price}
        symbol={market.underlying.symbol}
        type={'supply'}
        textProps={{ textAlign: "end", fontWeight: "bold" }}
        hasClaimableRewards={market.hasClaimableRewards}
    />;

    useDebouncedEffect(() => {
        setDebounced(!!editLeverageLevel && (!editLeverageLevel.endsWith('.') || editLeverageLevel === '.') && !isNaN(parseFloat(editLeverageLevel)));
    }, [editLeverageLevel], 500);

    useDebouncedEffect(() => {
        setDebounced(false);
        validatePendingLeverage(sliderLeverageLevel);
    }, [sliderLeverageLevel], 500);

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

    const handleSliderLeverage = (value: string) => {
        setDebounced(false);
        setLeverageLevel(value);
        setSliderLeverageLevel(value);
    }

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            validatePendingLeverage(editLeverageLevel);
        }
    }

    const handleLeverageChange = async (v: number) => {
        setDebounced(false);
        setLeverageLevel(v);
        if(!market.price || v <= 1) return;
        const { dolaAmount, collateralAmount, errorMsg } = await getLeverageImpact({
            setLeverageLoading,
            leverageLevel: parseFloat(v),
            market,
            debt,
            deposits,
            initialDeposit: collateralAmountNum,
            isUp: isLeverageUp,
            aleSlippage,
            dolaPrice,
        });
        if (!!errorMsg) {
            showToast({ status: 'warning', description: errorMsg, title: 'ZeroX api error' })
            return
        }
        onLeverageChange({
            dolaAmount,
            collateralAmount,
            isLeverageUp,
        })
    }

    const isInvalidLeverage = (input: number) => {
        return !input || isNaN(input) || input < minLeverage || input > maxLeverage;
    }

    const validatePendingLeverage = (v: string) => {
        const input = parseFloat(v);
        if (isInvalidLeverage(input)) {
            return;
        }
        handleLeverageChange(input);
    }

    const round = (v: number) => Math.floor(v * 100) / 100;

    const isLeverageUp = type === 'up';

    const newBorrowLimit = 100 - newPerc;
    const leverageSteps = useMemo(() => getSteps(market, deposits, debt, perc, type, 1), [market, deposits, debt, perc, type]);
    const maxLeverage = round(leverageSteps[leverageSteps.length - 1]);
    const leverageRelativeToMax = leverageLevel / maxLeverage;

    const { dbrExpiryDate, debt: currentTotalDebt } = useAccountDBR(account);
    // const newTotalDebt = currentTotalDebt + deltaBorrow;
    const { dbrExpiryDate: newDBRExpiryDate, dailyDebtAccrual: newDailyDBRBurn } = useAccountDBR(account, newTotalDebt);

    const risk = leverageRelativeToMax <= 0.5 ?
        riskLevels.low : leverageRelativeToMax <= 0.60 ?
            riskLevels.lowMid : leverageRelativeToMax <= 0.70 ?
                riskLevels.mid : leverageRelativeToMax <= 0.80 ?
                    riskLevels.midHigh : riskLevels.high;

    const currentRiskColor = getRiskColor(perc);
    const newRiskColor = getRiskColor(newPerc);

    const boostLabel = isLeverageUp ? 'Leverage' : 'Deleverage';
    const now = Date.now();

    if(!isInvPrimeMember && INV_STAKERS_ONLY.firmLeverage) {
        return <InvPrime showLinks={false} />
    }

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
                    <Input autocomplete="off" onKeyPress={handleKeyPress} id="boostInput" color={risk.color} py="0" pl="60px" onChange={(e) => handleEditLeverage(e.target.value, minLeverage, maxLeverage)} width="220px" value={editLeverageLevel} min={minLeverage} max={maxLeverage} />
                    {
                        editLeverageLevel !== leverageLevel.toFixed(2) && debounced && !isInvalidLeverage(parseFloat(editLeverageLevel)) &&
                        <InputRightElement cursor="pointer" transform="translateX(40px)" onClick={() => validatePendingLeverage(editLeverageLevel)}
                            children={<CheckCircleIcon transition="ease-in-out" transitionDuration="300ms" transitionProperty="color" _hover={{ color: 'success' }} />}
                        />
                    }
                </InputGroup>
                {
                    leverageLoading && <Text fontWeight="bold" color="secondaryTextColor">Loading...</Text>
                }
                {
                    !leverageLoading && leverageLevel > 1 && <TextInfo direction="row-reverse" message={isLeverageUp ? `Collateral added thanks to leverage` : `Collateral reduced thanks to deleverage`}>
                        <HStack fontWeight="bold" spacing="0" alignItems="center">
                            {isLeverageUp ? <ArrowUpIcon color="success" fontSize="18px" /> : <ArrowDownIcon color="warning" fontSize="18px" />}
                            <Text fontSize="14px" textAlign="center">
                                ~{smartShortNumber(isLeverageUp ? parseFloat(leverageCollateralAmount) : collateralAmountNum, 8)} {market.underlying.symbol}
                            </Text>
                        </HStack>
                    </TextInfo>
                }
                {
                    !leverageLoading && leverageLevel > 1 && <TextInfo direction="row-reverse" message={isLeverageUp ? `Debt added due to leverage` : `Debt reducable via deleveraging, if higher than the current debt, the leftover DOLA will be transferred to the user`}>
                        <HStack fontWeight="bold" spacing="0" alignItems="center">
                            {isLeverageUp ? <ArrowUpIcon color="warning" fontSize="18px" /> : <ArrowDownIcon color="success" fontSize="18px" />}
                            <Text fontSize="14px" textAlign="center">
                                ~{smartShortNumber(!isLeverageUp ? parseFloat(leverageDebtAmount) : debtAmountNum, 2)} DEBT
                            </Text>
                        </HStack>
                    </TextInfo>
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
                onChange={(v: number) => handleSliderLeverage(v)}
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
                    No leverage
                </Text>
                <Text textDecoration="underline" fontWeight="bold" cursor="pointer" color={riskLevels.riskier.color} onClick={() => handleLeverageChange(maxLeverage)}>
                    Max: x{shortenNumber(maxLeverage, 2)}
                </Text>
            </HStack>
            <HStack w='full' justify="space-between">
                <TextInfo
                    message="Collateral price can vary, the max. slippage % allows the swap required for leverage to be within a certain range, if out of range, tx will revert or fail">
                    <Text>
                        Max. swap slippage for leverage %:
                    </Text>
                </TextInfo>
                <Input py="0" maxH="30px" w='90px' value={aleSlippage} onChange={(e) => setAleSlippage(e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1'))} />
            </HStack>
            {
                newBorrowLimit >= 99 && <WarningMessage description="New borrow limit would be too high" />
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