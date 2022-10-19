import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { useDBRPrice } from "@app/hooks/useDBR"
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect"
import { F2Market } from "@app/types"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { HStack, VStack, Text, FormControl, FormLabel, Switch, useMediaQuery, StackProps } from "@chakra-ui/react"
import { useEffect, useState } from "react"

export const MarketBar = ({
    market,
    isWalkthrough = false,
    setIsWalkthrough,
    ...props
}: {
    setIsWalkthrough: (v: boolean) => void
    market: F2Market
    isWalkthrough?: boolean
} & Partial<StackProps>) => {
    const { price: dbrPrice } = useDBRPrice();
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    const [effectEnded, setEffectEnded] = useState(true);

    useEffect(() => {
        setEffectEnded(false);
    }, [isWalkthrough])

    useDualSpeedEffect(() => {
        setEffectEnded(true);
    }, [isWalkthrough], !isWalkthrough, 200, 50);

    return <HStack w='full' justify="space-between" {...props}>
        <HStack spacing={{ base: '2', md: '8' }}>
            <HStack spacing={{ base: '1', md: '2' }}>
                <MarketImage pr="2" image={market.icon || market.underlying.image} size={isLargerThan ? 40 : 30} />
                <VStack spacing="1" alignItems="flex-start">
                    <Text as="h1" fontWeight="extrabold" fontSize={{ base: '14px', md: '20px' }}>
                        {market.name} Market
                    </Text>
                    <Text as="h1" color="secondaryTextColor" fontSize={{ base: '14px', md: '16px' }}>
                        {shortenNumber(market.dolaLiquidity, 2)} DOLA liquidity
                    </Text>
                </VStack>
            </HStack>
            {
                isLargerThan && <VStack spacing="1" alignItems="flex-start">
                    <Text as="h1" fontWeight="extrabold" fontSize="20px">
                        Oracle Price
                    </Text>
                    <Text as="h1" color="secondaryTextColor">
                        {preciseCommify(market.price, 2, true)}
                    </Text>
                </VStack>
            }
            {
                !isWalkthrough && effectEnded && isLargerThan && <>
                    <VStack spacing="1" alignItems="flex-start">
                        <Text as="h1" fontWeight="extrabold" fontSize="20px">
                            Collateral Factor
                        </Text>
                        <Text as="h1" color="secondaryTextColor">
                            {preciseCommify(market.collateralFactor * 100, 2)}%
                        </Text>
                    </VStack>
                    <VStack spacing="1" alignItems="flex-start">
                        <Text as="h1" fontWeight="extrabold" fontSize="20px">
                            DBR Price
                        </Text>
                        <Text as="h1" color="secondaryTextColor">
                            {preciseCommify(dbrPrice, 4, true)}
                        </Text>
                    </VStack>
                </>
            }
        </HStack>
        <HStack>
            <FormControl
                display="inline-flex"
                flexDirection={{ base: 'column', md: 'row' }}
                alignItems={{ base: 'flex-end', md: 'center' }}
                justify="flex-end"
            >
                <FormLabel
                    fontSize={{ base: '12px', md: '14px' }}
                    display={{ base: 'contents', md: 'inline-block' }}
                    color="mainTextColor"
                    cursor="pointer"
                    htmlFor='walkthrough-mode'
                    textAlign="right"
                    mb='0'
                >
                    Walkthrough mode
                </FormLabel>
                <Switch isChecked={isWalkthrough} onChange={() => setIsWalkthrough(!isWalkthrough)} id='walkthrough-mode' />
            </FormControl>
        </HStack>
    </HStack>
}