import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Badge, BadgeProps, Stack, InputGroup, InputRightElement, InputLeftElement } from '@chakra-ui/react'

import { useContext, useEffect, useMemo, useState } from 'react'
import { getNumberToBn, shortenNumber, smartShortNumber } from '@app/util/markets'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { ArrowDownIcon, ArrowUpIcon, CheckCircleIcon } from '@chakra-ui/icons'
import { showToast } from '@app/util/notify'
import { Input } from '@app/components/common/Input'
import { F2MarketContext } from '../F2Contex'
import { f2CalcNewHealth, getDepletionDate, getRiskColor } from '@app/util/f2'
import { capitalize, preciseCommify } from '@app/util/misc'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { F2Market } from '@app/types'
import { useAccountDBR } from '@app/hooks/useDBR'
import { AnchorPoolInfo } from '@app/components/Anchor/AnchorPoolnfo'
import { TextInfo } from '@app/components/common/Messages/TextInfo'

const getSteps = (market: F2Market, deposits: number, debt: number, perc: number, type: string, leverageLevel: number, steps: number[] = [], doLastOne = false): number[] => {
    const inputWorth = market.price ? deposits * market.price : 0;
    const isLeverageUp = type === 'up';
    const _leverageLevel = leverageLevel + 0.01;
    const effectiveLeverage = isLeverageUp ? _leverageLevel : 1 / _leverageLevel;
    const desiredWorth = inputWorth * effectiveLeverage;

    const deltaBorrow = desiredWorth - inputWorth;
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

const RiskBadge = ({ color, text, onClick }: { color: BadgeProps["bgColor"], text: string, onClick: () => void }) => {
    return <RSubmitButton w='70px' _hover={{ filter: 'brightness(1.05)' }} userSelect="none" cursor="pointer" onClick={onClick} bgColor={color} color="white">
        {text}
    </RSubmitButton>
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
        onFirmLeverageEngineOpen,
    } = useContext(F2MarketContext);

    const borrowApy = dbrPrice * 100;
    const minLeverage = 1.01;
    // const [leverageLevel, setLeverageLevel] = useState(minLeverage || _leverageLevel);
    const [editLeverageLevel, setEditLeverageLevel] = useState(leverageLevel.toString());
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

    useEffect(() => {
        setEditLeverageLevel(leverageLevel.toFixed(2));
    }, [leverageLevel])

    if (!market?.underlying) {
        return <></>
    }

    const handleEditLeverage = (e: any) => {
        setDebounced(false);
        const stringAmount = e.target.value.replace(/[^0-9.]/, '').replace(/(\..*)\./g, '$1');
        setEditLeverageLevel(stringAmount);
    }

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            validateEditLeverage();
        }
    }

    const handleLeverageChange = (v: number) => {
        setDebounced(false);
        setLeverageLevel(v);
    }

    const isInvalidLeverage = (input: number) => {
        return !input || isNaN(input) || input < minLeverage || input > maxLeverage;
    }

    const validateEditLeverage = () => {
        const input = parseFloat(editLeverageLevel);
        if (isInvalidLeverage(input)) {
            return;
        }
        handleLeverageChange(input);
    }

    const round = (v: number) => Math.floor(v * 100) / 100;

    const inputWorth = market.price ? deposits * market.price : 0;
    const isLeverageUp = type === 'up';
    const effectiveLeverage = isLeverageUp ? leverageLevel : 1 / leverageLevel;
    const desiredWorth = inputWorth * effectiveLeverage;

    const deltaBorrow = desiredWorth - inputWorth;
    const collateralPrice = market.price;
    const targetCollateralBalance = collateralPrice ? desiredWorth / collateralPrice : 0;
    const deltaCollateral = targetCollateralBalance - deposits;

    const {
        newDebt,
        newPerc,
        newLiquidationPrice,
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        targetCollateralBalance - deposits,
        deltaBorrow,
        perc,
    );

    const newBorrowLimit = 100 - newPerc;
    const leverageSteps = useMemo(() => getSteps(market, deposits, debt, perc, type, 1), [market, deposits, debt, perc, type]);
    const maxLeverage = round(leverageSteps[leverageSteps.length - 1]);
    const leverageRelativeToMax = leverageLevel / maxLeverage;

    const { dbrExpiryDate, debt: currentTotalDebt } = useAccountDBR(account);
    const newTotalDebt = currentTotalDebt + deltaBorrow;
    const { dbrExpiryDate: newDBRExpiryDate, dailyDebtAccrual: newDailyDBRBurn } = useAccountDBR(account, newTotalDebt);

    const risk = leverageRelativeToMax <= 0.5 ?
        riskLevels.low : leverageRelativeToMax <= 0.60 ?
            riskLevels.lowMid : leverageRelativeToMax <= 0.70 ?
                riskLevels.mid : leverageRelativeToMax <= 0.80 ?
                    riskLevels.midHigh : riskLevels.high;

    const currentRiskColor = getRiskColor(perc);
    const newRiskColor = getRiskColor(newPerc);

    useDebouncedEffect(() => {
        onLeverageChange({
            deltaBorrow,
            newBorrowLimit,
            newDebt,
            deltaCollateral,
        });
    }, [deltaBorrow, newBorrowLimit, newDebt, deltaCollateral], 100);

    useEffect(() => {
        if (leverageLevel !== minLeverage) {
            return;
        }
        const length = leverageSteps.length;
        setLeverageLevel(length > 2 ? leverageSteps[Math.floor(length / 2)] : 1);
    }, [leverageSteps]);

    const boostLabel = isLeverageUp ? 'Leverage' : 'Deleverage';
    const now = Date.now();

    return <Stack fontSize="14px" spacing="4" w='full' direction={{ base: 'column', lg: 'row' }} justify="space-between" alignItems="center">
        <VStack position="relative" w='full' alignItems="center" justify="center">
            <HStack w='full' justify="center" alignItems="center">
                {/* <RiskBadge {...riskLevels.safer} onClick={() => handleLeverageChange(leverageLevel - 1 >= minLeverage ? round(leverageLevel - 1) : minLeverage)} /> */}
                <InputGroup
                    w='fit-content'
                    alignItems="center"
                >
                    <InputLeftElement
                        children={<Text cursor="text" as="label" for="boostInput" color="secondaryTextColor" whiteSpace="nowrap" transform="translateX(60px)" fontSize="20px" fontWeight="extrabold">
                            {boostLabel}:
                        </Text>}
                    />
                    <Input onKeyPress={handleKeyPress} id="boostInput" color={risk.color} py="0" pl="60px" onChange={(e) => handleEditLeverage(e, minLeverage, maxLeverage)} width="220px" value={editLeverageLevel} min={minLeverage} max={maxLeverage} />
                    {
                        editLeverageLevel !== leverageLevel.toFixed(2) && debounced && !isInvalidLeverage(parseFloat(editLeverageLevel)) &&
                        <InputRightElement cursor="pointer" transform="translateX(40px)" onClick={() => validateEditLeverage()}
                            children={<CheckCircleIcon transition="ease-in-out" transitionDuration="300ms" transitionProperty="color" _hover={{ color: 'success' }} />}
                        />
                    }
                </InputGroup>
                <TextInfo direction="row-reverse" message={isLeverageUp ? `Collateral added thanks to leverage` : `Collateral reduced thanks to deleverage`}>
                    <HStack color="success" fontWeight="bold" spacing="1" alignItems="center">
                        {isLeverageUp ? <ArrowUpIcon fontSize="18px"  /> : <ArrowDownIcon fontSize="18px" />}
                        <Text fontSize="16px">
                            {smartShortNumber(deltaCollateral, 8)} {market.underlying.symbol}
                        </Text>
                    </HStack>
                </TextInfo>
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
                {/* <RiskBadge {...riskLevels.riskier} onClick={() => handleLeverageChange(leverageLevel + 1 <= maxLeverage ? round(leverageLevel + 1) : maxLeverage)} /> */}
            </HStack>
            <Slider
                value={leverageLevel}
                onChange={(v: number) => handleLeverageChange(v)}
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
                <Text textDecoration="underline" fontWeight="bold" cursor="pointer" color={riskLevels.safer.color} onClick={() => setLeverageLevel(minLeverage)}>
                    Min: x{shortenNumber(minLeverage, 2)}
                </Text>
                <Text textDecoration="underline" fontWeight="bold" cursor="pointer" color={riskLevels.riskier.color} onClick={() => setLeverageLevel(maxLeverage)}>
                    Max: x{shortenNumber(maxLeverage, 2)}
                </Text>
            </HStack>
            {
                newBorrowLimit >= 99 && <WarningMessage alertProps={{ position: 'absolute', top: '110px' }} description="New borrow limit would be too high" />
            }
        </VStack>
        {showDetails && <InfoMessage
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
                                {smartShortNumber(deposits, 2)}
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
        />}
    </Stack>
}