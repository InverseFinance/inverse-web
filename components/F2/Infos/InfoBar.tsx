import { MarketImage } from "@app/components/common/Assets/MarketImage"
import Link from "@app/components/common/Link"
import { useAccountDBR, useDBRPrice } from "@app/hooks/useDBR"
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect"
import { getDBRBuyLink, getRiskColor } from "@app/util/f2"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { HStack, VStack, Text, useMediaQuery, StackProps, TextProps, Stack } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { F2MarketContext } from "../F2Contex"
import moment from 'moment'
import Container from "@app/components/common/Container"
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect"

const Title = (props: TextProps) => <Text fontWeight="extrabold" fontSize={{ base: '14px', md: '18px' }} {...props} />;
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
        dbrBalance,
        debt,
        liquidationPrice,
        perc,
    } = useContext(F2MarketContext);

    const [liquidity, setLiquidity] = useState(market.dolaLiquidity);

    useEffect(() => {
        setEffectEnded(false);
    }, [isWalkthrough])

    useDualSpeedEffect(() => {
        setEffectEnded(true);
    }, [isWalkthrough], !isWalkthrough, 200, 50);   
    
    useDebouncedEffect(() => {
        setLiquidity(market.leftToBorrow);
    }, [market.dolaLiquidity, market.leftToBorrow], 500);

    const needTopUp = dbrBalance < 0 || (dbrBalance === 0 && debt > 0);
    const riskColor = getRiskColor(perc);

    const loanInfos = <>
        <VStack spacing="1" alignItems="flex-start">
            <Title>
                Liq. Price
            </Title>
            <SubTitle color={riskColor}>
                {preciseCommify(liquidationPrice, 2, true)}
            </SubTitle>
        </VStack>
        <VStack spacing="1" alignItems="flex-end">
            <Title textAlign="right">
                Loan Health
            </Title>
            <SubTitle textAlign="right" color={riskColor}>
                {shortenNumber(perc, 2)}%
            </SubTitle>
        </VStack>
    </>;

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
        <VStack spacing="1" alignItems={{ base: 'flex-end', md: 'flex-start' }}>
            <Title alignItems={{ base: 'flex-end', md: 'flex-start' }}>
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
        {
            debt > 0 && isLargerThan1000 && loanInfos
        }
    </>;

    return <Container noPadding p="0">
        <VStack w='full' {...props}>
            <HStack w='full' justify="space-between">
                <HStack w='full' spacing={{ base: '2', md: '8' }} justify="space-between">
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
                                    <SubTitle fontWeight={liquidity === 0 ? 'bold' : undefined} color={liquidity === 0 ? 'warning' : 'secondaryTextColor'}>
                                        {liquidity ? shortenNumber(liquidity, 0, false, true) : 'No'} DOLA liquidity
                                    </SubTitle>
                            }
                        </VStack>
                    </HStack>
                    <VStack spacing="1" alignItems={{ base: 'flex-end', md: 'flex-start' }}>
                        <Title>
                            Oracle Price
                        </Title>
                        <SubTitle>
                            {preciseCommify(market.price, 2, true)}
                        </SubTitle>
                    </VStack>

                    {
                        !isWalkthrough && effectEnded && isLargerThan1000 && otherInfos
                    }
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
            {
                debt > 0 && !isLargerThan1000 && <HStack w='full' justify="space-between">{loanInfos}</HStack>
            }
        </VStack>
    </Container>
}

export const DbrBar = ({
    account,
    ...props
}: {
} & Partial<StackProps>) => {
    const { dbrNbDaysExpiry, signedBalance: dbrBalance, dailyDebtAccrual, dbrDepletionPerc, dbrExpiryDate, balance, debt } = useAccountDBR(account);

    const hasDebt = dailyDebtAccrual !== 0;

    const needsRechargeSoon = dbrNbDaysExpiry <= 30 && hasDebt;

    const { price: dbrPrice } = useDBRPrice();
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    const [isLargerThan1000] = useMediaQuery('(min-width: 1000px)');

    const needTopUp = dbrBalance < 0 || (dbrBalance === 0 && debt > 0);

    const dbrBalanceInfos = <VStack spacing="1" alignItems="flex-start">
        <Title>
            DBR Balance
        </Title>

        <Link color={needTopUp ? 'error' : 'secondaryTextColor'} href={getDBRBuyLink()} isExternal target='_blank'>
            {
                dbrBalance > 0 && <SubTitle color="inherit">
                    {shortenNumber(dbrBalance, 2, false, true)}{!!dbrBalance && ` (${shortenNumber(dbrBalance * dbrPrice, 2, true, true)})`}
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

    return <VStack w='full' {...props}>
        <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
            <HStack w={{ base: 'full', md: 'auto' }} justify="flex-start">
                {
                    isLargerThan && <MarketImage pr="2" image={`/assets/v2/dbr-512.jpg`} size={40} imgProps={{ borderRadius: '100px' }} />
                }
                <HStack spacing="4" w={{ base: 'full', md: 'auto' }} justify={{ base: 'space-between', md: 'flex-start' }}>
                    {
                        dbrBalanceInfos
                    }
                    <VStack spacing="1" alignItems="flex-start">
                        <Title>
                            Total Debt
                        </Title>
                        <SubTitle color="secondaryTextColor">
                            {preciseCommify(debt, 2, true)}
                        </SubTitle>
                    </VStack>
                    <VStack spacing="1" alignItems={{ base: 'flex-end', md: 'flex-start' }}>
                        <Title>
                            Daily Spend Rate
                        </Title>
                        <SubTitle color="secondaryTextColor">
                            {preciseCommify(-dailyDebtAccrual, 2, false)} DBR
                        </SubTitle>
                    </VStack>
                </HStack>
            </HStack>
            <HStack w={{ base: 'full', md: 'auto' }} justify="space-between" spacing={{ base: '2', md: '8' }}>
                <VStack spacing="1" alignItems="flex-start">
                    <Title>
                        Depletion Time
                    </Title>
                    <SubTitle fontWeight={needsRechargeSoon ? 'bold' : 'inherit'} color={needsRechargeSoon ? 'warning' : 'secondaryTextColor'}>
                        {dbrBalance <= 0 ? 'Depleted' : moment(dbrExpiryDate).fromNow()}
                    </SubTitle>
                </VStack>
                <VStack spacing="1" alignItems='flex-end'>
                    <Title>
                        Depletion Date
                    </Title>
                    <SubTitle fontWeight={needsRechargeSoon ? 'bold' : 'inherit'} color={needsRechargeSoon ? 'warning' : 'secondaryTextColor'}>
                        {dbrBalance <= 0 ? 'Depleted' : moment(dbrExpiryDate).format('MMM Mo, YYYY')}
                    </SubTitle>
                </VStack>
            </HStack>
        </Stack>
    </VStack>
}