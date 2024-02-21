import { SimpleGrid, StackProps, Text, VStack, HStack, Image, Flex, useMediaQuery } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { useAccountDBR, useAccountF2Markets, useDBR, useDBRBalanceHisto, useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR';
import { getClosestPreviousHistoValue, preciseCommify, timestampToUTC } from "@app/util/misc";
import { lightTheme } from "@app/variables/theme";
import moment from "moment";
import { PieChartRecharts } from "../Transparency/PieChartRecharts";
import { useINVEscrowRewards, useStakedInFirm } from "@app/hooks/useFirm";
import { BigTextLoader } from "../common/Loaders/BigTextLoader";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import Link from "../common/Link";
import { BURN_ADDRESS, BUY_LINKS } from "@app/config/constants";
import { useEffect, useRef, useState } from "react";
import { FirmRewardWrapper } from "./rewards/FirmRewardWrapper";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { TOKEN_IMAGES } from "@app/variables/images";
import { useFirmUserPositionEvolution } from "./WorthEvoChartContainer";
import { AccountDBRMarket } from "@app/types";
import { WorthEvoChart } from "./WorthEvoChart";
import { useDebouncedEffect } from "@app/hooks/useDebouncedEffect";
import { SkeletonBlob } from "../common/Skeleton";
import { F2Markets } from "./F2Markets";
import { InfoMessage } from "../common/Messages";
import { useStakedDola, useStakedDolaBalance } from "@app/util/dola-staking";

const MAX_AREA_CHART_WIDTH = 625;

const FirmInvEvoChart = ({
    market
}: {
    market: AccountDBRMarket,
}) => {
    const { escrow } = market;
    const { rewards } = useINVEscrowRewards(escrow);
    const { data, isLoading } = useFirmUserPositionEvolution(market, 'comboPrice', rewards);

    if (!escrow || escrow === BURN_ADDRESS) {
        return null
    }

    return <DashboardAreaChart
        isLoading={isLoading}
        market={market}
        data={data}
        priceRef={'comboPrice'}
        isSimplified={true}
    />
}

const DashboardAreaChart = (props) => {
    const { isLoading, data } = props;
    const refElement = useRef();
    const [chartData, setChartData] = useState(null);
    const [refElementWidth, setRefElementWidth] = useState(MAX_AREA_CHART_WIDTH);
    const [oldJson, setOldJson] = useState('');
    const [chartWidth, setChartWidth] = useState<number>(MAX_AREA_CHART_WIDTH);
    const [isLargerThan2xl, isLargerThanLg, isLargerThanXs] = useMediaQuery([
        "(min-width: 96em)",
        "(min-width: 62em)",
        "(min-width: 250px)",
    ]);

    useEffect(() => {
        if (!refElement?.current) return;
        setRefElementWidth(refElement.current.clientWidth);
    }, [refElement?.current])

    useEffect(() => {
        const optimal2ColWidth = ((screen.availWidth || screen.width)) / 2 - 50;
        const optimal1ColWidth = ((screen.availWidth || screen.width)) * 0.94 - 50;
        const w = !isLargerThanXs ? 250 : isLargerThan2xl ? MAX_AREA_CHART_WIDTH : isLargerThanLg ? Math.min(optimal2ColWidth, refElementWidth) : optimal1ColWidth;
        setChartWidth(w);
    }, [isLargerThan2xl, isLargerThanXs, isLargerThanLg, screen?.availWidth]);

    useDebouncedEffect(() => {
        const len = data?.length || 0;
        if (len > 0 && !isLoading && !chartData) {
            const json = len > 3 ? JSON.stringify([data[0], data[len - 2]]) : JSON.stringify(data);
            if (oldJson !== json) {
                setChartData(data);
                setOldJson(json);
            }
        }
    }, [data, isLoading, oldJson, chartData]);

    if (!chartData && isLoading) {
        return <SkeletonBlob mt="10" />
    }
    else if (!chartData) {
        return null;
    }

    // too much flickering when using the responsive container
    return <VStack w='full' ref={refElement}>
        <WorthEvoChart
            chartWidth={chartWidth}
            {...props}
            data={chartData}
        />
    </VStack>
}

const DbrEvoChart = ({
    account,
}: {
    account: string
}) => {
    const { evolution, isLoading: isLoadingHisto } = useDBRBalanceHisto(account);
    const { historicalData, isLoading: isLoadingDBR } = useDBR();
    const histoPrices = historicalData && !!historicalData?.prices ? historicalData.prices.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr[0])]: curr[1] }), {}) : {};

    const formattedData = evolution?.map(e => {
        const utcDay = timestampToUTC(e.timestamp);
        const histoPrice = histoPrices[utcDay] || getClosestPreviousHistoValue(histoPrices, utcDay, 0);
        return {
            ...e,
            balanceWorth: e.balance * histoPrice,
            histoPrice,
        }
    });

    const isLoading = isLoadingHisto || isLoadingDBR;

    return <DashboardAreaChart
        isLoading={isLoading}
        market={{ name: 'DBR' }}
        data={formattedData}
        priceRef={'histoPrice'}
        isSimplified={true}
    />
}

const DashBoardCard = (props: StackProps & { cardTitle?: string, href?: string, imageSrc?: string }) => {
    return <Flex
        w="full"
        borderRadius={8}
        mt={0}
        p={8}
        position="relative"
        alignItems="center"
        minH="150px"
        shadow="0 0 0px 1px rgba(0, 0, 0, 0.25)"
        bg={'containerContentBackground'}
        {...props}
    >
        {!!props.cardTitle && <Text fontSize="18px" fontWeight="bold" mx="auto" w='200px' position="absolute" left="0" right="0" top={{ base: '5px', xl: '32px' }}>{props.cardTitle}</Text>}
        {!!props.imageSrc && <Image borderRadius="50px" src={props.imageSrc} w="30px" h="30px" position="absolute" left="10px" top="10px" />}
        {props.children}
    </Flex>
}

const NumberItem = ({ noDataFallback = '-', href = '', footer = undefined, isLoading = false, value = 0, price = undefined, label = '', isUsd = false, precision = 0 }) => {
    return <VStack spacing="0" justify="center" alignItems="flex-end" w='full'>
        <VStack alignItems="flex-end" spacing="1">
            {
                isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize={price ? { base: '22px', '2xl': '24px' } : { base: '30px', '2xl': '36px' }} color={'mainTextColor'}>
                    {!value ? noDataFallback : value > 100000 ? smartShortNumber(value, 2, isUsd) : preciseCommify(value, precision, isUsd)}{!!price && !!value ? ` (${smartShortNumber(value * price, 2, true)})` : ''}
                </Text>
            }
            {
                !!value && !!href ?
                    <Link fontSize="18px" fontWeight="bold" color={'mainTextColorLight'} textDecoration="underline" href={href}>{label}</Link>
                    : !!value && !href ? <Text fontSize="18px" fontWeight="bold" color={'mainTextColorLight'}>
                        {label}
                    </Text> : null
            }
        </VStack>
        {footer}
    </VStack>
}

const NumberCard = ({ imageSrc = '', noDataFallback = undefined, href = undefined, footer = undefined, isLoading = false, value = 0, label = '', price = undefined, isUsd = false, precision = 0 }) => {
    return <DashBoardCard imageSrc={imageSrc}>
        <NumberItem href={href} noDataFallback={noDataFallback} isLoading={isLoading} price={price} value={value} label={label} isUsd={isUsd} precision={precision} footer={footer} />
    </DashBoardCard>
}

const StringItem = ({ footer = undefined, color = 'mainTextColor', value = '', label = '', isLoading = false }) => {
    return <VStack spacing="0" justify="center" alignItems="flex-end" w='full'>
        <VStack alignItems="flex-end" w='full' spacing="1">
            {
                isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize="30px" color={color}>{value}</Text>
            }
            <Text fontSize="18px" fontWeight="bold" color={'mainTextColorLight'}>{label}</Text>
            {footer}
        </VStack>
    </VStack>
}

const StringCard = ({ imageSrc = '', footer = undefined, color = undefined, value = '', label = '', isLoading = false }) => {
    return <DashBoardCard imageSrc={imageSrc}>
        <StringItem footer={footer} color={color} isLoading={isLoading} value={value} label={label} />
    </DashBoardCard>
}

const PieItem = ({ data, activeFill = lightTheme.colors.mainTextColor, fill = lightTheme.colors.mainTextColorLight, width = 600, height = 250, dataKey = 'value', nameKey = 'name', precision = 2, isUsd = false }) => {
    return <PieChartRecharts
        isUsd={isUsd}
        precision={precision}
        width={width}
        height={height}
        data={data}
        dataKey={dataKey}
        nameKey={nameKey}
        cx="50%"
        cy="50%"
        outerRadius={50}
        activeFill={activeFill}
        fill={fill}
    />
}

const NumberAndPieCard = ({ isLoading, footer = undefined, noDataFallback = undefined, fill, activeFill, data, value, label, width = 350, height = 250, dataKey = 'value', nameKey = 'name', precision = 2, isUsd = false }) => {
    return <DashBoardCard minH="314px" direction={{ base: 'column', sm: 'row' }} alignItems="center" justify="space-around" px="16">
        {
            !isLoading && !data?.length ? noDataFallback : <PieItem fill={fill} activeFill={activeFill} data={data} width={width} height={height} dataKey={dataKey} nameKey={nameKey} precision={precision} isUsd={isUsd} />
        }
        <NumberItem footer={footer} isLoading={isLoading} value={value} label={label} precision={precision} isUsd={isUsd} />
    </DashBoardCard>
}

const CardFooter = ({ labelLeft = '', labelRight = '' }) => {
    return <HStack position="absolute" left="0" right="0" px="8" bottom="8px" w='full' justify="space-between">
        <Text whiteSpace="nowrap" textAlign="left" color={'mainTextColorLight'} fontSize="14px">
            {labelLeft}
        </Text>
        <Text whiteSpace="nowrap" textAlign="right" color={'mainTextColorLight'} fontSize="14px">
            {labelRight}
        </Text>
    </HStack>
}

const CallToAction = ({ href = '', ...props }) => {
    return <RSubmitButton px="8" h="60px" fontSize="28px" fontWeight="bold" {...props} />
}

const SmallCallToAction = ({ href = '', ...props }) => {
    return <RSubmitButton px="6" h="40px" fontSize="20px" fontWeight="bold"  {...props} />
}

const BigLinkBtn = ({ href = '', ...props }) => {
    return <Link href={href} isExternal={true}>
        <CallToAction {...props} />
    </Link>
}
const SmallLinkBtn = ({ href = '', ...props }) => {
    return <Link href={href} isExternal={true}>
        <SmallCallToAction {...props} />
    </Link>
}

const BorrowDola = <BigLinkBtn href="/firm">Borrow DOLA</BigLinkBtn>;
const SupplyAssets = <BigLinkBtn href="/firm">Supply Assets</BigLinkBtn>;
const StakeINV = <SmallLinkBtn href="/firm">Stake INV</SmallLinkBtn>;
const StakeDOLA = <SmallLinkBtn href="/sDOLA">Stake DOLA</SmallLinkBtn>;

export const UserDashboard = ({
    account
}: {
    account: string
}) => {
    const { markets, isLoading: isLoadingMarkets } = useDBRMarkets();
    const [isVirginFirmUser, setIsVirginFirmUser] = useState(false);
    const { priceUsd: dbrPrice, priceDola: dbrDolaPrice } = useDBRPrice();
    const accountMarkets = useAccountF2Markets(markets, account);
    const { balance: stakedDolaBalance } = useStakedDolaBalance(account);
    const { apr: sDolaApr, projectedApr: sDolaProjectedApr, sDolaExRate } = useStakedDola(dbrDolaPrice);
    const dolaStakedInSDola = sDolaExRate && stakedDolaBalance ? sDolaExRate * stakedDolaBalance : 0;
    const invMarket = accountMarkets?.find(m => m.isInv);
    const { themeStyles } = useAppTheme();
    const { stakedInFirm, isLoading: isLoadingInvStaked } = useStakedInFirm(account);
    const { debt, dbrExpiryDate, signedBalance: dbrBalance, needsRechargeSoon, isLoading: isLoadingAccount } = useAccountDBR(account);

    const isLoading = !account ? false : isLoadingMarkets || isLoadingAccount || isLoadingInvStaked;

    const totalTotalSuppliedUsd = accountMarkets.reduce((prev, curr) => prev + curr.deposits * curr.price, 0);
    const marketsWithDeposits = accountMarkets.filter(m => m.depositsUsd > 1).sort((a, b) => b.depositsUsd - a.depositsUsd);
    const marketsWithDebt = accountMarkets.filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt);

    useDebouncedEffect(() => {
        setIsVirginFirmUser(!isLoading && !marketsWithDeposits?.length);
    }, [isLoading, marketsWithDeposits]);

    return <VStack w='full' spacing="8">
        {
            isVirginFirmUser ? <VStack w='full' alignItems="flex-start">
                <InfoMessage
                    alertProps={{ w: 'full' }}
                    title='No position in FiRM at the moment'
                    description="Once you have assets in one the markets below, more data will be shown in the dashboard"
                />
                <F2Markets isDashboardPage={true} />
            </VStack>
                :
                <SimpleGrid columns={{ base: 1, xl: 2 }} spacing="8" w="100%" >
                    <NumberAndPieCard footer={
                        <CardFooter
                            labelRight={<Link textDecoration="underline" href="/firm">Go to markets</Link>}
                        />
                    } noDataFallback={SupplyAssets} isLoading={isLoading} fill={themeStyles.colors.mainTextColorLight} activeFill={themeStyles.colors.mainTextColor} value={totalTotalSuppliedUsd} label="Deposits" precision={0} isUsd={true} data={marketsWithDeposits} dataKey="depositsUsd" />
                    <NumberAndPieCard noDataFallback={BorrowDola} isLoading={isLoading} fill={themeStyles.colors.warning} activeFill={themeStyles.colors.error} value={debt} label="DOLA debt" precision={0} isUsd={false} data={marketsWithDebt} dataKey="debt" />
                </SimpleGrid>
        }
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing="8" w="100%">
            <NumberCard imageSrc={TOKEN_IMAGES.INV} footer={
                <CardFooter
                    labelLeft={<>INV APR: <b>{shortenNumber(invMarket?.supplyApy, 2)}%</b></>}
                    labelRight={<>DBR APR: <b>{shortenNumber(invMarket?.dbrApr, 2)}%</b></>}
                />
            } href="/firm/INV" noDataFallback={StakeINV} isLoading={isLoading} price={invMarket?.price} value={stakedInFirm} label="INV staked in FiRM" precision={2} />
            <NumberCard
                imageSrc={TOKEN_IMAGES.DOLA}
                footer={
                    <CardFooter
                        labelLeft={<>APR: <b>{shortenNumber(sDolaApr, 2)}%</b></>}
                        labelRight={<>proj. APR: <b>{shortenNumber(sDolaProjectedApr, 2)}%</b></>}
                    />
                } href="/sDOLA" noDataFallback={StakeDOLA} isLoading={isLoading} value={dolaStakedInSDola} label="DOLA staked" precision={2} />
            <NumberCard
                imageSrc={TOKEN_IMAGES.DBR}
                footer={
                    <CardFooter
                        labelRight={<>Price: <b>{shortenNumber(dbrPrice, 4, true)}</b></>}
                    />
                }
                isLoading={isLoading} price={dbrPrice} value={dbrBalance} label="DBR balance" precision={0} />
            <StringCard
                imageSrc={TOKEN_IMAGES.DBR}
                footer={
                    <CardFooter
                        labelLeft={<Link isExternal target="_blank" textDecoration="underline" href={BUY_LINKS.DBR}>Buy via DEX</Link>}
                        labelRight={<Link textDecoration="underline" href="/dbr/auction">Buy via auctions</Link>}
                    />
                } color={needsRechargeSoon ? 'error' : undefined} isLoading={isLoading} value={debt > 0 ? dbrBalance < 0 ? 'Depleted' : moment(dbrExpiryDate).format('MMM Do YYYY') : '-'} label="DBR depletion date" />
        </SimpleGrid>
        {
            invMarket?.depositsUsd > 1 && <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="8" w="100%">
                <DashBoardCard cardTitle="Staked INV evolution" imageSrc={TOKEN_IMAGES.INV}>
                    <FirmInvEvoChart market={invMarket} />
                </DashBoardCard>
                <DashBoardCard cardTitle="DBR balance evolution" imageSrc={TOKEN_IMAGES.DBR}>
                    <DbrEvoChart account={account} />
                </DashBoardCard>
            </SimpleGrid>
        }
        <SimpleGrid columns={{ base: 1, '2xl': 2 }} spacing="8" w="100%">
            {
                accountMarkets
                    .filter(market => market.hasClaimableRewards && !!market.escrow && market.escrow !== BURN_ADDRESS)
                    .map(market => {
                        return <FirmRewardWrapper
                            key={market.address}
                            market={market}
                            showMarketBtn={true}
                            extraAtBottom={true}
                            escrow={market.escrow}
                        />
                    })
            }
        </SimpleGrid>
    </VStack>
}
