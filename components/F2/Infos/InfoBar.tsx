import { MarketImage } from "@app/components/common/Assets/MarketImage"
import Link from "@app/components/common/Link"
import { useAccountDBR, useDBRMarkets, useDBRPrice, useDBRReplenishmentPrice } from "@app/hooks/useDBR"
import { useDualSpeedEffect } from "@app/hooks/useDualSpeedEffect"
import { getRiskColor } from "@app/util/f2"
import { shortenNumber } from "@app/util/markets"
import { preciseCommify } from "@app/util/misc"
import { HStack, VStack, Text, useMediaQuery, StackProps, TextProps, Stack } from "@chakra-ui/react"
import { useContext, useEffect, useState } from "react"
import { F2MarketContext } from "../F2Contex"
import moment from 'moment'
import Container from "@app/components/common/Container"
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect"
import { useDOLAPrice, usePrices } from "@app/hooks/usePrices"
import { useDOLA } from "@app/hooks/useDOLA"
import { BUY_LINKS } from "@app/config/constants"
import { useFirmTVL } from "@app/hooks/useTVL"
import 'add-to-calendar-button';
import { DbrReminder } from "../DbrReminder"
import { WarningTwoIcon } from "@chakra-ui/icons"
import { WarningMessage } from "@app/components/common/Messages"

const Title = (props: TextProps) => <Text textAlign="center" fontWeight="extrabold" fontSize={{ base: '13px', md: '18px' }} {...props} />;
const SubTitle = (props: TextProps) => <Text textAlign="center" color="secondaryTextColor" fontSize={{ base: '13px', md: '16px' }} {...props} />;

const DbrRepMsg = ({ replenishmentDailyRate, ...props }: { replenishmentDailyRate: number }) => <WarningMessage
    description={
        <HStack spacing='1' display={{ base: 'inline-block', sm: 'inline-flex' }} {...props}>
            <Text><b>You are out of DBR,</b></Text>
            <Link style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" fontWeight="extrabold" color={'error'} href={BUY_LINKS.DBR} isExternal target='_blank'>
                please top-up your balance,
            </Link>
            <Text>the daily cost is <b>{replenishmentDailyRate}% of your debt</b></Text>
        </HStack>
    } />;

export const MarketBar = ({
    ...props
}: {
} & Partial<StackProps>) => {
    const { price: dbrPrice } = useDBRPrice();
    const [isLargerThan400] = useMediaQuery('(min-width: 400px)');
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    const [isLargerThan1000] = useMediaQuery('(min-width: 1000px)');
    const [effectEnded, setEffectEnded] = useState(true);
    const { replenishmentDailyRate } = useDBRReplenishmentPrice();

    const {
        market,
        isWalkthrough,
        dbrBalance,
        debt,
        liquidationPrice,
        perc,
        dbrExpiryDate,
    } = useContext(F2MarketContext);

    const [available, setAvailable] = useState(market.dolaLiquidity);

    useEffect(() => {
        setEffectEnded(false);
    }, [isWalkthrough])

    useDualSpeedEffect(() => {
        setEffectEnded(true);
    }, [isWalkthrough], !isWalkthrough, 200, 50);

    useDebouncedEffect(() => {
        setAvailable(market.leftToBorrow);
    }, [market.dolaLiquidity, market.leftToBorrow], 500);

    const needTopUp = dbrBalance < 0 || (dbrBalance === 0 && debt > 0);
    const riskColor = getRiskColor(perc);

    const loanInfos = <>
        <VStack spacing={{ base: '0', sm: '1' }} alignItems="flex-start">
            <Title>
                Liq. Price
            </Title>
            <SubTitle color={riskColor}>
                {preciseCommify(liquidationPrice, 2, true)}
            </SubTitle>
        </VStack>
        <VStack spacing={{ base: '0', sm: '1' }} alignItems="flex-end">
            <Title textAlign="right">
                Loan Health
            </Title>
            <SubTitle textAlign="right" color={riskColor}>
                {shortenNumber(perc, 2)}%
            </SubTitle>
        </VStack>
    </>;

    const DbrBalance = ({ alignItems, depletedLabel = 'Top-up now' }) => <VStack
        spacing={{ base: '0', sm: '1' }}
        alignItems={alignItems}
    >
        <Title alignItems={alignItems}>
            DBR Balance
        </Title>

        <Link color={needTopUp ? 'error' : 'secondaryTextColor'} href={BUY_LINKS.DBR} isExternal target='_blank'>
            {
                dbrBalance > 0 && <SubTitle color="inherit">
                    {shortenNumber(dbrBalance, 2)}{!!dbrBalance && ` (${shortenNumber(dbrBalance * dbrPrice, 2, true)})`}
                </SubTitle>
            }
            {
                dbrBalance === 0 && !debt && <SubTitle textDecoration="underline" style={{ 'text-decoration-skip-ink': 'none' }} color="inherit">
                    Buy now
                </SubTitle>
            }
            {
                needTopUp && <SubTitle textDecoration="underline" style={{ 'text-decoration-skip-ink': 'none' }} color="inherit" fontWeight={dbrBalance < 0 ? 'extrabold' : 'normal'}>
                    {shortenNumber(dbrBalance, 2)} {depletedLabel}
                </SubTitle>
            }
        </Link>
    </VStack>;

    const otherInfos = <>
        <VStack spacing={{ base: '0', sm: '1' }} alignItems="flex-start">
            <Title>
                C.F
            </Title>
            <SubTitle color="secondaryTextColor">
                {preciseCommify(market.collateralFactor * 100, 2)}%
            </SubTitle>
        </VStack>
        <VStack spacing={{ base: '0', sm: '1' }} alignItems={{ base: 'flex-end', md: 'flex-start' }}>
            <Title>
                DBR Price
            </Title>
            <SubTitle color="secondaryTextColor">
                {preciseCommify(dbrPrice, 4, true)}
            </SubTitle>
        </VStack>
        {isLargerThan && <DbrBalance alignItems={{ base: 'flex-end', md: 'flex-start' }} />}
        {isLargerThan && debt > 0 && <VStack h='80px' w='202px'>
            <VStack position="absolute">
                <DbrReminder dbrExpiryDate={dbrExpiryDate} dbrBalance={dbrBalance} />
            </VStack>
        </VStack>}
        {/* {
            debt > 0 && isLargerThan1000 && loanInfos
        } */}
    </>;

    return <Container noPadding p="0">
        <VStack w='full' {...props}>
            {
                !isLargerThan400 && <HStack>
                    <MarketImage pr="2" image={market.icon || market.underlying.image} size={isLargerThan ? 40 : 30} />
                    <Title>
                        {market.name} Market
                    </Title>
                </HStack>
            }
            <HStack w='full' alignItems="flex-start" justify="space-between">
                <HStack w='full' spacing={{ base: '2', md: '8' }} justify="space-between">
                    <HStack spacing={{ base: '1', md: '2' }}>
                        {
                            isLargerThan400 && <MarketImage pr="2" image={market.icon || market.underlying.image} size={isLargerThan ? 40 : 30} />
                        }
                        <VStack spacing={{ base: '0', sm: '1' }} alignItems={{ md: 'flex-start' }}>
                            <Title textAlign="left">
                                Liquidity
                            </Title>
                            <SubTitle>
                                {market.dolaLiquidity > 1 ? `${preciseCommify(market.dolaLiquidity, available < 100 ? 2 : 0, false)} DOLA` : 'No DOLA liquidity'}
                            </SubTitle>
                        </VStack>
                    </HStack>
                    <VStack spacing={{ base: '0', sm: '1' }} alignItems={{ base: 'flex-start' }}>
                        <Title textAlign="left">
                            Available to borrow
                        </Title>
                        {
                            market.borrowPaused ?
                                <SubTitle fontWeight="bold" color={'warning'}>
                                    Paused
                                </SubTitle>
                                :
                                <SubTitle fontWeight={available === 0 ? 'bold' : undefined} color={available === 0 ? 'warning' : 'secondaryTextColor'}>
                                    {available ? `${preciseCommify(available, available < 100 ? 2 : 0, false)} DOLA` : 'No DOLA available'}
                                </SubTitle>
                        }
                    </VStack>
                    <VStack spacing={{ base: '0', sm: '1' }} alignItems={{ base: 'flex-end', md: 'flex-start' }}>
                        <Title>
                            {market.isInv ? '' : 'Oracle '}Price
                        </Title>
                        <SubTitle>
                            {market.price ? preciseCommify(market.price, 2, true) : '-'}
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
            {
                debt > 0 && !isLargerThan && <HStack w='full' justify="space-between">
                    <DbrBalance alignItems={{ base: 'flex-start' }} depletedLabel='Top-up' />
                    <VStack h='80px' w='202px'>
                        <VStack position="absolute">
                            <DbrReminder dbrExpiryDate={dbrExpiryDate} dbrBalance={dbrBalance} />
                        </VStack>
                    </VStack>
                </HStack>
            }
            {/* {
                !isLargerThan && dbrBalanceEl
            }
            {
                debt > 0 && !isLargerThan1000 && <DbrReminder dbrExpiryDate={dbrExpiryDate} dbrBalance={dbrBalance} />
            } */}
            {
                needTopUp && <DbrRepMsg replenishmentDailyRate={replenishmentDailyRate} />
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
    const { replenishmentDailyRate } = useDBRReplenishmentPrice();

    const hasDebt = dailyDebtAccrual !== 0;

    const needsRechargeSoon = dbrNbDaysExpiry <= 30 && hasDebt;

    const { price: dbrPrice } = useDBRPrice();
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    const [isLargerThan1000] = useMediaQuery('(min-width: 1000px)');

    const needTopUp = dbrBalance < 0 || (dbrBalance === 0 && debt > 0);

    const dbrBalanceInfos = <VStack w={{ base: '33%', md: 'auto' }} spacing="1" alignItems="flex-start">
        <Title>
            DBR Balance
        </Title>

        <Link color={needTopUp ? 'error' : 'secondaryTextColor'} href={BUY_LINKS.DBR} isExternal target='_blank'>
            {
                dbrBalance > 0 && <SubTitle textAlign="left" color="inherit">
                    {shortenNumber(dbrBalance, 2, false, true)}{!!dbrBalance && ` (${shortenNumber(dbrBalance * dbrPrice, 2, true, true)})`}
                </SubTitle>
            }
            {
                dbrBalance === 0 && !debt && <SubTitle textAlign="left" color="inherit">
                    Buy now
                </SubTitle>
            }
            {
                needTopUp && <SubTitle textAlign="left" style={{ 'text-decoration-skip-ink': 'none' }} textDecoration="underline" color="inherit" fontWeight={dbrBalance < 0 ? 'extrabold' : 'normal'}>
                    {shortenNumber(dbrBalance, 2)} Top-up now
                </SubTitle>
            }
        </Link>
    </VStack>

    return <VStack w='full' {...props}>
        <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
            <HStack w={{ base: 'full', md: 'auto' }} justify="flex-start">
                {/* {
                    isLargerThan && <MarketImage pr="2" image={`/assets/v2/dbr.png`} size={40} imgProps={{ borderRadius: '100px' }} />
                } */}
                <HStack spacing="4" w={{ base: 'full', md: 'auto' }} justify={{ base: 'space-between', md: 'flex-start' }}>
                    {
                        dbrBalanceInfos
                    }
                    <VStack w={{ base: '33%', md: 'auto' }} spacing="1" alignItems="center">
                        <Title>
                            Total Debt
                        </Title>
                        <SubTitle color="secondaryTextColor">
                            {preciseCommify(debt, 2, true)}
                        </SubTitle>
                    </VStack>
                    <VStack w={{ base: '33%', md: 'auto' }} spacing="1" alignItems={{ base: 'flex-end', md: 'center' }}>
                        <Title>
                            Daily Spend
                        </Title>
                        <SubTitle color="secondaryTextColor">
                            {preciseCommify(-dailyDebtAccrual, 2, false)} DBR
                        </SubTitle>
                    </VStack>
                </HStack>
            </HStack>
            <HStack w={{ base: 'full', md: 'auto' }} justify="space-between" spacing={{ base: '2', md: '8' }}>
                <VStack spacing="1" alignItems={{ base: 'flex-start', md: 'flex-end' }}>
                    <Title textAlign="right">
                        DBR Depletion Time
                    </Title>
                    <SubTitle textAlign="right" display="flex" alignItems="center" fontWeight={needsRechargeSoon ? 'extrabold' : 'inherit'} color={needsRechargeSoon ? dbrBalance < 0 ? 'error' : 'warning' : 'secondaryTextColor'}>
                        {dbrBalance <= 0 && <WarningTwoIcon mr="1" />}{dbrBalance <= 0 ? 'Depleted' : moment(dbrExpiryDate).fromNow()}
                        {/* {isLargerThan1000 && ` - ${moment(dbrExpiryDate).fromNow()}`} */}
                    </SubTitle>
                </VStack>
                <VStack spacing="1" alignItems='flex-end'>
                    {/* <Title>
                        DBR Depletion Date
                    </Title> */}
                    <DbrReminder dbrExpiryDate={dbrExpiryDate} dbrBalance={dbrBalance} />
                    {/* <SubTitle fontWeight={needsRechargeSoon ? 'bold' : 'inherit'} color={needsRechargeSoon ? 'warning' : 'secondaryTextColor'}>
                        {dbrBalance <= 0 ? 'Depleted' : moment(dbrExpiryDate).format('MMM Do, YYYY')}
                    </SubTitle> */}
                </VStack>
            </HStack>
        </Stack>
        {
            needTopUp && <VStack pt="8">
                <DbrRepMsg replenishmentDailyRate={replenishmentDailyRate} />
            </VStack>
        }
    </VStack>
}

const BarBlock = ({
    label,
    isLargerThan,
    imgSrc,
    price,
    href,
    vstackProps,
    precision = 2,
}: {
    label: string,
    isLargerThan: boolean,
    imgSrc: string,
    price: number,
    precision?: number,
    href: string,
    vstackProps?: StackProps,
}) => {
    return <HStack spacing="4">
        {
            isLargerThan && <MarketImage image={imgSrc} size={40} imgProps={{ borderRadius: '100px' }} />
        }
        <VStack spacing="1" alignItems="flex-start" {...vstackProps}>
            <Link textDecoration="underline" fontWeight="extrabold" fontSize={{ base: '14px', md: '18px' }} color="mainTextColor" textAlign="left" href={href} isExternal target='_blank'>
                {label}
            </Link>

            <Text textAlign="left" color="secondaryTextColor">
                {shortenNumber(price, precision, true)}
            </Text>
        </VStack>
    </HStack>
}

export const FirmBar = ({
    ...props
}: {
} & Partial<StackProps>) => {
    const { prices } = usePrices();
    const { price: dbrPrice } = useDBRPrice();
    const { totalSupply, firmSupply } = useDOLA();
    const { price: dolaPrice } = useDOLAPrice();
    const { firmTotalTvl } = useFirmTVL();
    const { markets } = useDBRMarkets();
    const [isLargerThan] = useMediaQuery('(min-width: 600px)');
    const [isLargerThan1000] = useMediaQuery('(min-width: 1000px)');
    const totalDebt = markets?.reduce((prev, curr) => prev + curr.totalDebt, 0) || 0;
    const totalDebtUsd = totalDebt * dolaPrice;

    return <VStack w='full' {...props}>
        <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-between">
            <HStack alignItems="flex-start" w={{ base: 'full', md: 'auto' }} justify="flex-start">
                <HStack spacing="8" w={{ base: 'full', md: 'auto' }} justify={{ base: 'space-between', md: 'flex-start' }}>
                    <BarBlock label="Buy DBR" isLargerThan={isLargerThan} precision={4} price={dbrPrice} href={BUY_LINKS.DBR} imgSrc={`/assets/v2/dbr.png`} />
                    <BarBlock label="Buy DOLA" isLargerThan={isLargerThan} precision={4} price={dolaPrice} href={'/swap'} imgSrc={`/assets/v2/dola-512.jpg`} vstackProps={{ alignItems: { base: 'center', md: 'flex-start' } }} />
                    <BarBlock label="Buy INV" isLargerThan={isLargerThan} price={prices?.['inverse-finance']?.usd} href={BUY_LINKS.INV} imgSrc={`/assets/inv-square-dark.jpeg`} vstackProps={{ alignItems: { base: 'flex-end', md: 'flex-start' } }} />
                </HStack>
            </HStack>
            <HStack w={{ base: 'full', md: 'auto' }} alignItems="flex-start" justify="space-between" spacing={{ base: '2', md: '8' }}>
                <VStack w={{ base: '33%', md: 'auto' }} spacing="1" alignItems={{ base: 'flex-start', md: 'center' }}>
                    <Link textAlign="center" textDecoration="underline" color="mainTextColor" fontSize={{ base: '14px', md: '18px' }} fontWeight="extrabold" href="/transparency/feds/policy/all">
                        {isLargerThan ? 'Total ' : ''}DOLA Supply
                    </Link>
                    <SubTitle>
                        {shortenNumber(totalSupply, 2)}
                    </SubTitle>
                </VStack>
                <VStack w={{ base: '33%', md: 'auto' }} spacing="1" alignItems='center'>
                    <Link textAlign="center" textDecoration="underline" color="mainTextColor" fontSize={{ base: '14px', md: '18px' }} fontWeight="extrabold" href="/firm/positions">
                        FiRM TVL
                    </Link>
                    <SubTitle>
                        {shortenNumber(firmTotalTvl, 2, true)}
                    </SubTitle>
                </VStack>
                <VStack w={{ base: '33%', md: 'auto' }} spacing="1" alignItems='flex-end'>
                    <Link textAlign="center" textDecoration="underline" color="mainTextColor" fontSize={{ base: '14px', md: '18px' }} fontWeight="extrabold" href="/firm/positions">
                        FiRM Borrows
                    </Link>
                    <SubTitle textAlign="center">
                        {shortenNumber(totalDebt, 2, false)} ({shortenNumber(totalDebtUsd, 2, true)})
                    </SubTitle>
                </VStack>
            </HStack>
        </Stack>
    </VStack>
}