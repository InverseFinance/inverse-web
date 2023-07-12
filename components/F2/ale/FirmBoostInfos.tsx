import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Badge, BadgeProps, Stack, InputGroup, InputRightElement, InputLeftElement } from '@chakra-ui/react'

import { useContext, useEffect, useMemo, useState } from 'react'
import { getNumberToBn, shortenNumber } from '@app/util/markets'
import { InfoMessage, WarningMessage } from '@app/components/common/Messages'
import { AnimatedInfoTooltip } from '@app/components/common/Tooltip'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { showToast } from '@app/util/notify'
import { Input } from '@app/components/common/Input'
import { F2MarketContext } from '../F2Contex'
import { f2CalcNewHealth, getRiskColor } from '@app/util/f2'
import { capitalize, preciseCommify } from '@app/util/misc'
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect'
import { RSubmitButton } from '@app/components/common/Button/RSubmitButton'
import { F2Market } from '@app/types'

const getSteps = (market: F2Market, deposits: number, debt: number, perc: number, type: string, leverageLevel: number, steps: number[] = []): number[] => {
    const inputWorth = market.price ? deposits * market.price : 0;
    const isLeverageUp = type === 'up';
    const _leverageLevel = leverageLevel + 0.01;
    const effectiveLeverage = isLeverageUp ? _leverageLevel : 1 / _leverageLevel;
    const desiredWorth = inputWorth * effectiveLeverage;

    const borrowRequired = desiredWorth - inputWorth;
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
        borrowRequired,
        perc,
    );
    if((newPerc <= 1) || newDebt < 0 || _leverageLevel > 10) {
        return steps;
    } else {
        return getSteps(market, deposits, debt, perc, type, _leverageLevel, [...steps, _leverageLevel]);
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
    return <RSubmitButton w='70px' _hover={{ filter: 'brightness(1.05)' }} userSelect="none" cursor="pointer" onClick={onClick}  bgColor={color} color="white">
        {text}
    </RSubmitButton>
}

export const FirmBoostInfos = ({
    type = 'up',
    onLeverageChange,
}: {
    type?: 'up' | 'down',
    onLeverageChange: ({  }) => void
}) => {
    const {
        market,
        dbrPrice,
        deposits,
        debt,
        perc,
        borrowLimit,
        liquidationPrice,
    } = useContext(F2MarketContext);

    const borrowApy = dbrPrice * 100;
    const minLeverage = 1.01;
    const [leverageLevel, setLeverageLevel] = useState(minLeverage);
    const [editLeverageLevel, setEditLeverageLevel] = useState(leverageLevel.toString());
    const [debounced, setDebounced] = useState(false);

    useDebouncedEffect(() => {
        setDebounced(true);
    }, [editLeverageLevel], 500);

    useEffect(() => {
        setEditLeverageLevel(leverageLevel.toFixed(2));
    }, [leverageLevel])

    if (!market?.underlying) {
        return <></>
    }

    const handleEditLeverage = (e: any) => {
        setDebounced(false);
        setEditLeverageLevel(e.target.value);
    }

    const handleKeyPress = (e: any) => {
        if (e.key === 'Enter') {
            validateEditLeverage();
        }
    }

    const handleLeverageChange = (v: number) => {
        setDebounced(false);
        setLeverageLevel(v);
        // onLeverageChange(getNumberToBn(borrowRequired));
    }

    const validateEditLeverage = () => {
        const input = parseFloat(editLeverageLevel);
        if (!input || isNaN(input) || input < minLeverage || input > maxLeverage) {
            showToast({ status: 'info', title: 'Invalid value for Boost', description: 'The value should be between min and max' });
            return
        }
        handleLeverageChange(input);
    }

    const round = (v: number) => Math.floor(v * 100) / 100;

    const inputWorth = market.price ? deposits * market.price : 0;
    const isLeverageUp = type === 'up';
    const effectiveLeverage = isLeverageUp ? leverageLevel : 1 / leverageLevel;
    const desiredWorth = inputWorth * effectiveLeverage;

    const borrowRequired = desiredWorth - inputWorth;
    const collateralPrice = market.price;
    const targetCollateralBalance = collateralPrice ? desiredWorth / collateralPrice : 0;

    const {
        newDebt,
        newPerc,
        newLiquidationPrice,
    } = f2CalcNewHealth(
        market,
        deposits,
        debt,
        targetCollateralBalance - deposits,
        borrowRequired,
        perc,
    );

    const newBorrowLimit = 100 - newPerc;
    const leverageSteps = useMemo(() => getSteps(market, deposits, debt, perc, type, 1), [market, deposits, debt, perc, type]);
    const maxLeverage = round(leverageSteps[leverageSteps.length - 1]);
    const leverageRelativeToMax = leverageLevel / maxLeverage;

    const risk = leverageRelativeToMax <= 0.5 ?
        riskLevels.low : leverageRelativeToMax <= 0.60 ?
            riskLevels.lowMid : leverageRelativeToMax <= 0.70 ?
                riskLevels.mid : leverageRelativeToMax <= 0.80 ?
                    riskLevels.midHigh : riskLevels.high;

    const currentRiskColor = getRiskColor(perc);
    const newRiskColor = getRiskColor(newPerc);

    useDebouncedEffect(() => {
        onLeverageChange({
            borrowRequired,
            newBorrowLimit,
            newDebt,
        });
    }, [borrowRequired, newBorrowLimit, newDebt], 100);

    useEffect(() => {
        const length = leverageSteps.length;
        setLeverageLevel(length > 2 ? leverageSteps[Math.floor(length/2)] : 1);
    }, [leverageSteps]);

    const boostLabel = isLeverageUp ? 'Boost' : 'Deleverage';

    return <Stack fontSize="14px" spacing="4" w='full' direction={{ base: 'column', lg: 'row' }} justify="space-between" alignItems="center">
        <VStack position="relative" w='50%' alignItems="center" justify="center">
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
                        parseFloat(editLeverageLevel) !== leverageLevel && debounced &&
                        <InputRightElement cursor="pointer" transform="translateX(40px)" onClick={() => validateEditLeverage()}
                            children={<CheckCircleIcon transition="ease-in-out" transitionDuration="300ms" transitionProperty="color" _hover={{ color: 'success' }} />}
                        />
                    }
                </InputGroup>
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
        <InfoMessage
            alertProps={{ w: '50%', p: '8', fontSize: '14px' }}
            showIcon={false}
            description={
                <VStack spacing="4" w='full' alignItems="flex-start" fontSize="18px">
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
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="The final position you'll get in exchange for your deposit, this is held as collateral on Frontier, not in your wallet" />
                            <Text>
                                Collateral change:
                            </Text>
                        </HStack>
                        <HStack>
                            <Text fontWeight="bold">
                                {preciseCommify(deposits, 4)}
                            </Text>
                            <Text fontWeight="bold">
                            =>
                            </Text>
                            <Text fontWeight="bold">
                                {preciseCommify(targetCollateralBalance, 4)} {market?.underlying?.symbol}
                            </Text>
                        </HStack>
                    </HStack>
                    {/* <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="To achieve the Boost, Borrowing a certain amount is required, the higher the Boost the higher the Debt" />
                            <Text>
                                Debt to add:
                            </Text>
                        </HStack>
                        <Text fontWeight="bold">
                            {preciseCommify(borrowRequired, 2, false)} DOLA
                        </Text>
                    </HStack> */}
                    <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="To achieve the Boost, Borrowing a certain amount is required, the higher the Boost the higher the Debt" />
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
                                {preciseCommify(newDebt, 2)} DOLA
                            </Text>
                        </HStack>
                    </HStack>
                    {/* <HStack w='full' justify="space-between" fontSize='14px'>
                        <HStack>
                            <AnimatedInfoTooltip type="tooltip" message="The current Collateral Price according to the Oracle" />
                            <Text>
                                Collateral Price:
                            </Text>
                        </HStack>
                        <Text fontWeight="bold">
                            {preciseCommify(collateralPrice, 2, true)}
                        </Text>
                    </HStack> */}
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
                                {preciseCommify(newLiquidationPrice, 2, true)}
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
        />
    </Stack>
}