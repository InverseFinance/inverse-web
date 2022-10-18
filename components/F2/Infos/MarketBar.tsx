import { MarketImage } from "@app/components/common/Assets/MarketImage"
import { useDBRPrice } from "@app/hooks/useDBR"
import { F2Market } from "@app/types"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { HStack, VStack, Text, FormControl, FormLabel, Switch, useMediaQuery } from "@chakra-ui/react"

export const MarketBar = ({
    market,
    isExtended = false,
    isWalkthrough = false,
    ...props
}: {
    isExtended?: boolean
    isWalkthrough?: boolean
    market: F2Market
}) => {
    const { price: dbrPrice } = useDBRPrice();
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    return <HStack w='full' justify="space-between" {...props}>
        <HStack spacing="8">
            <HStack>
                {
                    isLargerThan && <MarketImage pr="2" image={market.icon || market.underlying.image} size={40} />
                }
                <VStack spacing="1" alignItems="flex-start">
                    <Text as="h1" fontWeight="extrabold" fontSize="20px">
                        {market.name} Market
                    </Text>
                    <Text as="h1" color="secondaryTextColor">
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
                isExtended && isLargerThan && <>
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
            <FormControl>
                <FormLabel display="inline-block" color="mainTextColor" cursor="pointer" htmlFor='walkthrough-mode' mb='0'>
                    Walkthrough
                </FormLabel>
                <Switch isChecked={isWalkthrough} onChange={() => alert('Switch Feature available soon')} id='walkthrough-mode' />
            </FormControl>
        </HStack>
    </HStack>
}