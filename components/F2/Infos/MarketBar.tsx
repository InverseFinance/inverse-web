import { MarketImage } from "@app/components/common/Assets/MarketImage"
import Link from "@app/components/common/Link"
import { useDBRPrice } from "@app/hooks/useDBR"
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect"
import { getDBRBuyLink } from "@app/util/f2"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { HStack, VStack, Text, FormControl, FormLabel, Switch, useMediaQuery, StackProps, TextProps } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { F2MarketContext } from "../F2Contex"

const Title = (props: TextProps) => <Text fontWeight="extrabold" fontSize={{ base: '14px', md: '20px' }} {...props} />;
const SubTitle = (props: TextProps) => <Text color="secondaryTextColor" fontSize={{ base: '14px', md: '16px' }} {...props} />;

export const MarketBar = ({
    ...props
}: {
} & Partial<StackProps>) => {
    const { price: dbrPrice } = useDBRPrice();
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    const [isLargerThan1000] = useMediaQuery('(min-width: 1000px)');
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

    const otherInfos = <>
        <VStack spacing="1" alignItems="flex-start">
            <Title>
                Collateral Factor
            </Title>
            <SubTitle color="secondaryTextColor">
                {preciseCommify(market.collateralFactor * 100, 2)}%
            </SubTitle>
        </VStack>
        <VStack spacing="1" alignItems="flex-start">
            <Title>
                DBR Price
            </Title>
            <SubTitle color="secondaryTextColor">
                {preciseCommify(dbrPrice, 4, true)}
            </SubTitle>
        </VStack>
        <VStack spacing="1" alignItems="flex-start">
            <Title>
                DBR Balance
            </Title>

            <Link color={needTopUp ? 'error' : 'secondaryTextColor'} href={getDBRBuyLink()} isExternal target='_blank'>
                {
                    dbrBalance > 0 && <SubTitle color="inherit">
                        {shortenNumber(dbrBalance, 2)}{!!dbrBalance && ` (${shortenNumber(dbrBalance * dbrPrice, 2, true)})`}
                    </SubTitle>
                }
                {
                    dbrBalance === 0 && !debt && <SubTitle color="inherit">
                        Buy now
                    </SubTitle>
                }
                {
                    needTopUp && <SubTitle color="inherit">
                        {shortenNumber(dbrBalance, 2)} Top-up now
                    </SubTitle>
                }
            </Link>
        </VStack>
    </>;

    return <VStack w='full' {...props}>
        <HStack w='full' justify="space-between">
            <HStack spacing={{ base: '2', md: '8' }}>
                <HStack spacing={{ base: '1', md: '2' }}>
                    <MarketImage pr="2" image={market.icon || market.underlying.image} size={isLargerThan ? 40 : 30} />
                    <VStack spacing="1" alignItems="flex-start">
                        <Title as='h2'>
                            {market.name} Market
                        </Title>
                        {
                            market.borrowPaused ?
                                <SubTitle fontWeight="bold" color={'warning'}>
                                    Paused
                                </SubTitle>
                                :
                                <SubTitle fontWeight={market.leftToBorrow === 0 ? 'bold' : undefined} color={market.leftToBorrow === 0 ? 'warning' : 'secondaryTextColor'}>
                                    {market.leftToBorrow ? shortenNumber(market.leftToBorrow, 0, false, true) : 'No'} DOLA borrowable
                                </SubTitle>
                        }
                    </VStack>
                </HStack>
                {
                    isLargerThan && <VStack spacing="1" alignItems="flex-start">
                        <Title>
                            Oracle Price
                        </Title>
                        <SubTitle>
                            {preciseCommify(market.price, 2, true)}
                        </SubTitle>
                    </VStack>
                }
                {
                    !isWalkthrough && effectEnded && isLargerThan1000 && otherInfos
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
        {
            !isWalkthrough && effectEnded && !isLargerThan1000 && <HStack
                w='full'
                justify="space-between"
                overflow="auto">
                {otherInfos}
            </HStack>
        }
    </VStack>
}