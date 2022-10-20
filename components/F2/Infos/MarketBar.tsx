import { MarketImage } from "@app/components/common/Assets/MarketImage"
import Link from "@app/components/common/Link"
import { useDBRPrice } from "@app/hooks/useDBR"
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect"
import { getDBRBuyLink } from "@app/util/f2"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { HStack, VStack, Text, FormControl, FormLabel, Switch, useMediaQuery, StackProps } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { F2MarketContext } from "../F2Contex"

export const MarketBar = ({
    ...props
}: {
} & Partial<StackProps>) => {
    const { price: dbrPrice } = useDBRPrice();
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    const [effectEnded, setEffectEnded] = useState(true);

    const {
        market,
        isWalkthrough,
        setIsWalkthrough,
        dbrBalance,
        debt,
    } = useContext(F2MarketContext);

    useEffect(() => {
        setEffectEnded(false);
    }, [isWalkthrough])

    useDualSpeedEffect(() => {
        setEffectEnded(true);
    }, [isWalkthrough], !isWalkthrough, 200, 50);

    const needTopUp = dbrBalance < 0 || (dbrBalance === 0 && debt > 0);

    return <HStack w='full' justify="space-between" {...props}>
        <HStack spacing={{ base: '2', md: '8' }}>
            <HStack spacing={{ base: '1', md: '2' }}>
                <MarketImage pr="2" image={market.icon || market.underlying.image} size={isLargerThan ? 40 : 30} />
                <VStack spacing="1" alignItems="flex-start">
                    <Text as='h2' fontWeight="extrabold" fontSize={{ base: '14px', md: '20px' }}>
                        {market.name} Market
                    </Text>
                    <Text color="secondaryTextColor" fontSize={{ base: '14px', md: '16px' }}>
                        {shortenNumber(market.dolaLiquidity, 2)} DOLA liquidity
                    </Text>
                </VStack>
            </HStack>
            {
                isLargerThan && <VStack spacing="1" alignItems="flex-start">
                    <Text fontWeight="extrabold" fontSize="20px">
                        Oracle Price
                    </Text>
                    <Text color="secondaryTextColor">
                        {preciseCommify(market.price, 2, true)}
                    </Text>
                </VStack>
            }
            {
                !isWalkthrough && effectEnded && isLargerThan && <>
                    <VStack spacing="1" alignItems="flex-start">
                        <Text fontWeight="extrabold" fontSize="20px">
                            Collateral Factor
                        </Text>
                        <Text color="secondaryTextColor">
                            {preciseCommify(market.collateralFactor * 100, 2)}%
                        </Text>
                    </VStack>
                    <VStack spacing="1" alignItems="flex-start">
                        <Text fontWeight="extrabold" fontSize="20px">
                            DBR Price
                        </Text>
                        <Text color="secondaryTextColor">
                            {preciseCommify(dbrPrice, 4, true)}
                        </Text>
                    </VStack>
                    <VStack spacing="1" alignItems="flex-start">
                        <Text fontWeight="extrabold" fontSize="20px">
                            DBR Balance
                        </Text>

                        <Link color={ needTopUp ? 'error' : 'secondaryTextColor' } href={getDBRBuyLink()} isExternal target='_blank'>
                            {
                                dbrBalance > 0 && <Text color="inherit">
                                    {shortenNumber(dbrBalance, 2)}{!!dbrBalance && ` (${shortenNumber(dbrBalance * dbrPrice, 2, true)})`}
                                </Text>
                            }
                            {
                                dbrBalance === 0 && !debt && <Text color="inherit">
                                    Buy now
                                </Text>
                            }
                            {
                                needTopUp && <Text color="inherit">
                                    {shortenNumber(dbrBalance, 2)} Top-up now
                                </Text>
                            }
                        </Link>
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
                    <VStack color="secondaryTextColor" spacing="0" alignItems="flex-end">
                        <Text color="inherit">Deposit & Borrow</Text>
                        <Text color="inherit">Walkthrough mode</Text>
                    </VStack>
                </FormLabel>
                <Switch colorScheme="purple" isChecked={isWalkthrough} onChange={() => setIsWalkthrough(!isWalkthrough)} id='walkthrough-mode' mr="1" />
            </FormControl>
        </HStack>
    </HStack>
}