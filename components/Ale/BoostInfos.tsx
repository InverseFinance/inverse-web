import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Badge, BadgeProps } from '@chakra-ui/react'

import { useState } from 'react'
import { Market, Token } from '@app/types'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { useAnchorPrices, usePricesV2 } from '@app/hooks/usePrices'

const powerBasis = 100;

const getSteps = (collateralFactor: number, steps: number[] = []): number[] => {
    if (!steps.length) {
        return getSteps(collateralFactor, [1 + collateralFactor]);
    }
    const lastLeverage = steps[steps.length - 1];
    const remainingPowerFor100 = powerBasis * Math.pow(collateralFactor, steps.length + 1);
    if (remainingPowerFor100 <= 1) {
        return steps;
    }
    return getSteps(collateralFactor, [...steps, lastLeverage + remainingPowerFor100 / powerBasis]);
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

const RiskBadge = ({ color, text }: { color: BadgeProps["bgColor"], text: string }) => {
    return <Badge fontSize="14px" py="2" px="4" borderRadius="20px" bgColor={color} color="white">
        {text}
    </Badge>
}

export const BoostInfos = ({
    inputToken,
    collateralMarket,
    borrowedMarket,
    inputAmount,
    onLeverageChange,
}: {
    inputToken: Token,
    collateralMarket: Market,
    borrowedMarket: Market,
    inputAmount: string,
    onLeverageChange: (v: number) => void
}) => {
    const { prices } = usePricesV2();
    const { prices: oraclePrices } = useAnchorPrices();
    const [leverageLevel, setLeverageLevel] = useState(1);

    const handleLeverageChange = (v: number) => {
        setLeverageLevel(v);
        onLeverageChange(v);
    }

    if (!collateralMarket || !inputToken) {
        return <></>
    }

    const inputWorth = prices[inputToken.coingeckoId || inputToken.symbol] ? parseFloat(inputAmount) * prices[inputToken.coingeckoId || inputToken.symbol].usd : 0;
    const desiredWorth = inputWorth * leverageLevel;
    const collateralWorth = inputWorth * collateralMarket.collateralFactor;
    const borrowRequired = desiredWorth - inputWorth;
    const collateralAmount = oraclePrices && oraclePrices[collateralMarket.token] ? desiredWorth / getBnToNumber(oraclePrices[collateralMarket.token], collateralMarket.underlying.decimals) : 0;
    const LTV = borrowRequired / desiredWorth;

    const leverageSteps = getSteps(collateralMarket.collateralFactor||0);

    const minLeverage = leverageSteps[0];
    const maxLeverage = leverageSteps[leverageSteps.length - 1];
    const leverageRelativeToMax = leverageLevel / maxLeverage;
    const risk = leverageRelativeToMax < 0.6 ?
        riskLevels.low : leverageRelativeToMax < 0.70 ?
            riskLevels.lowMid : leverageRelativeToMax < 0.80 ?
                riskLevels.mid : leverageRelativeToMax < 0.90 ?
                    riskLevels.midHigh : riskLevels.high;

    return <VStack w='full'>
        <HStack w='full' justify="space-between" alignItems="center">
            <RiskBadge {...riskLevels.safer} />
            <Text fontSize="20px" fontWeight="bold" color={risk.color}>
                Boost x{leverageLevel.toFixed(2)}
            </Text>
            <RiskBadge {...riskLevels.riskier} />
        </HStack>
        <Slider
            value={leverageLevel}
            onChange={(v: number) => handleLeverageChange(v)}
            min={minLeverage}
            max={maxLeverage}
            step={0.01}
            aria-label='slider-ex-4'
            defaultValue={leverageLevel}>
            <SliderTrack bg='red.100'>
                <SliderFilledTrack bg={risk.color} />
            </SliderTrack>
            <SliderThumb />
        </Slider>
        <HStack w='full' justify="space-between" alignItems="center">
            <Text fontWeight="bold" cursor="pointer" color={riskLevels.safer.color} onClick={() => setLeverageLevel(minLeverage)}>
                Min: x{shortenNumber(minLeverage, 2)}
            </Text>
            <Text fontWeight="bold" cursor="pointer" color={riskLevels.riskier.color} onClick={() => setLeverageLevel(maxLeverage)}>
                Max: x{shortenNumber(maxLeverage, 2)}
            </Text>
        </HStack>
        <HStack>
            <Text>Deposit:</Text>
            <Text>
                {shortenNumber(parseFloat(inputAmount), 4)} {inputToken?.symbol} ({shortenNumber(inputWorth, 2, true, true)})
            </Text>
        </HStack>
        <HStack>
            <Text>Desired Boost:</Text>
            <Text>
                x{leverageLevel.toFixed(2)} on {collateralMarket?.underlying?.symbol}
            </Text>
        </HStack>
        <HStack>
            <Text>{collateralMarket?.underlying?.symbol}'s Borrowing Power:</Text>
            <Text>
                {collateralMarket.collateralFactor * 100}% of {shortenNumber(inputWorth, 2, true)} = {shortenNumber(collateralWorth, 2, true)}
            </Text>
        </HStack>
        <HStack>
            <Text>Desired Boosted Collateral:</Text>
            <Text>
                {shortenNumber(collateralAmount, 2, false, true)} {collateralMarket?.underlying?.symbol} ({shortenNumber(desiredWorth, 2, true)})
            </Text>
        </HStack>
        <HStack>
            <Text>DOLA debt required to achieve the boost:</Text>
            <Text>
                {shortenNumber(desiredWorth, 2, true)} - {shortenNumber(inputWorth, 2, true)} = {shortenNumber(borrowRequired, 2)}
            </Text>
        </HStack>
        <HStack>
            <Text>
                Loan-To-Value Ratio:
            </Text>
            <Text>
                {shortenNumber(LTV * 100, 2, false)}%
            </Text>
        </HStack>
    </VStack>
}