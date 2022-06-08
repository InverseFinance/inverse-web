import { Slider, Text, VStack, SliderTrack, SliderFilledTrack, SliderThumb, HStack, Badge, BadgeProps } from '@chakra-ui/react'

import { useState } from 'react'
import { Market, Token } from '@app/types'
import { getBnToNumber, shortenNumber } from '@app/util/markets'
import { useAnchorPrices, usePricesV2 } from '@app/hooks/usePrices'
import { InfoMessage } from '@app/components/common/Messages'
import { AleFlowChart } from './AleFlowChart'

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
    return <Badge opacity="0.7" fontSize="14px" py="2" px="4" borderRadius="20px" bgColor={color} color="white">
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
    const minLeverage = 1.1;
    const [leverageLevel, setLeverageLevel] = useState(minLeverage);

    const handleLeverageChange = (v: number) => {
        setLeverageLevel(v);
        onLeverageChange(v);
    }

    if (!collateralMarket?.underlying || !inputToken) {
        return <></>
    }

    const inputWorth = prices[inputToken.coingeckoId || inputToken.symbol] ? parseFloat(inputAmount) * prices[inputToken.coingeckoId || inputToken.symbol].usd : 0;
    const desiredWorth = inputWorth * leverageLevel;
    const collateralWorth = inputWorth * collateralMarket.collateralFactor;
    const borrowRequired = desiredWorth - inputWorth;
    const collateralPrice = oraclePrices && oraclePrices[collateralMarket.token] ? getBnToNumber(oraclePrices[collateralMarket.token], collateralMarket.underlying.decimals) : 0;
    const collateralAmount = collateralPrice ? desiredWorth / collateralPrice : 0;
    const zapAmount = collateralPrice ? inputWorth / collateralPrice : 0;
    const LTV = borrowRequired / desiredWorth;

    const leverageSteps = getSteps(collateralMarket.collateralFactor || 0);

    const maxLeverage = leverageSteps[leverageSteps.length - 1];
    const leverageRelativeToMax = leverageLevel / maxLeverage;

    const risk = leverageRelativeToMax <= 0.5 ?
        riskLevels.low : leverageRelativeToMax <= 0.60 ?
            riskLevels.lowMid : leverageRelativeToMax <= 0.70 ?
                riskLevels.mid : leverageRelativeToMax <= 0.80 ?
                    riskLevels.midHigh : riskLevels.high;


    const boostedApy = (leverageLevel * collateralMarket.supplyApy / 100 - (leverageLevel - 1) * (borrowedMarket.borrowApy) / 100) * 100;

    const liquidationPrice = LTV * collateralPrice;
    const liquidationDistance = collateralPrice ? (collateralPrice - liquidationPrice) / collateralPrice : 0;

    return <VStack w='full' spacing="5">
        <HStack w='full' justify="space-between" alignItems="center">
            <RiskBadge {...riskLevels.safer} />
            <Text fontSize="20px" fontWeight="extrabold" color={risk.color}>
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
            <SliderTrack h="15px" bg='red.100'>
                <SliderFilledTrack bg={risk.color} />
            </SliderTrack>
            <SliderThumb h="30px" />
        </Slider>
        <HStack w='full' justify="space-between" alignItems="center">
            <Text fontWeight="bold" cursor="pointer" color={riskLevels.safer.color} onClick={() => setLeverageLevel(minLeverage)}>
                Min: x{shortenNumber(minLeverage, 2)}
            </Text>
            <Text fontWeight="bold" cursor="pointer" color={riskLevels.riskier.color} onClick={() => setLeverageLevel(maxLeverage)}>
                Max: x{shortenNumber(maxLeverage, 2)}
            </Text>
        </HStack>
        <InfoMessage
            alertProps={{ w: 'full' }}
            description={
                <VStack w='full' alignItems="flex-start">
                    <HStack>
                        <Text>Deposit:</Text>
                        <Text fontWeight="bold">
                            {shortenNumber(parseFloat(inputAmount), 4)} {inputToken?.symbol} ({shortenNumber(inputWorth, 2, true, true)})
                        </Text>
                    </HStack>
                    <HStack>
                        <Text>Desired Boost:</Text>
                        <Text fontWeight="bold">
                            x{leverageLevel.toFixed(2)} on {collateralMarket?.underlying?.symbol}
                        </Text>
                    </HStack>
                    <HStack>
                        <Text>Boost Result:</Text>
                        <Text fontWeight="bold">
                            {shortenNumber(collateralAmount, 2, false, true)} {collateralMarket?.underlying?.symbol} ({shortenNumber(desiredWorth, 2, true)})
                        </Text>
                    </HStack>
                    <HStack>
                        <Text>DOLA debt:</Text>
                        <Text fontWeight="bold">
                            {shortenNumber(borrowRequired, 2, true)}
                        </Text>
                    </HStack>
                    <HStack>
                        <Text>
                            Loan-To-Value Ratio:
                        </Text>
                        <Text fontWeight="bold">
                            {shortenNumber(LTV * 100, 2, false)}%
                        </Text>
                    </HStack>
                    <HStack>
                        <Text>
                            Liquidation Price:
                        </Text>
                        <Text fontWeight="bold">
                            {shortenNumber(liquidationPrice, 2, true)} ({shortenNumber(liquidationDistance * 100, 2)}% distance from current price {shortenNumber(collateralPrice, 2, true)})
                        </Text>
                    </HStack>
                </VStack>
            }
        />
        <AleFlowChart
            inputToken={inputToken}
            collateralMarket={collateralMarket}
            borrowMarket={borrowedMarket}
            inputAmount={parseFloat(inputAmount)}
            collateralAmount={collateralAmount}
            borrowedAmount={borrowRequired}
            supplyApy={collateralMarket.supplyApy}
            borrowApy={borrowedMarket.borrowApy}
            boostedApy={boostedApy}
            ltv={LTV}
            zapAmount={zapAmount}
        />
        <HStack w='full' justify="space-between" alignItems="center">
            <Text fontWeight="bold" color={riskLevels.safer.color}>
                {collateralMarket.underlying.symbol}'s Supply APY: {shortenNumber(collateralMarket.supplyApy, 2)}%
            </Text>
            <Text fontWeight="extrabold" fontSize="20px" color={boostedApy > 0 ? 'success' : 'warning'} onClick={() => setLeverageLevel(maxLeverage)}>
                Boosted APY: {shortenNumber(boostedApy, 2)}%
            </Text>
            <Text fontWeight="bold" color={riskLevels.riskier.color}>
                {borrowedMarket.underlying.symbol}'s Borrowing APY: -{shortenNumber(borrowedMarket.borrowApy, 2)}%
            </Text>
        </HStack>
    </VStack>
}