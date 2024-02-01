import { SimpleGrid, Stack, StackProps, Text, VStack, HStack, Image, Popover, PopoverTrigger, PopoverContent, PopoverBody, Flex, useMediaQuery } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { useAccountDBR, useAccountF2Markets, useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR';
import { preciseCommify } from "@app/util/misc";
import { lightTheme } from "@app/variables/theme";
import moment from "moment";
import { PieChartRecharts } from "../Transparency/PieChartRecharts";
import { useINVEscrowRewards, useStakedInFirm, useUserRewards } from "@app/hooks/useFirm";
import { usePrices } from "@app/hooks/usePrices";
import { BigTextLoader } from "../common/Loaders/BigTextLoader";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import Link from "../common/Link";
import { BURN_ADDRESS, BUY_LINKS } from "@app/config/constants";
import { useEffect, useState } from "react";
import { FirmRewardWrapper } from "./rewards/FirmRewardWrapper";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { TOKEN_IMAGES } from "@app/variables/images";
import { useFirmUserPositionEvolution } from "./WorthEvoChartContainer";
import { AccountDBRMarket } from "@app/types";
import { WorthEvoChartSimplified } from "./WorthEvoChart";

const FirmInvEvoChart = ({
    market
}: {
    market: AccountDBRMarket,
}) => {
    const { escrow } = market;
    const maxWidth = 600;
    const [chartWidth, setChartWidth] = useState<number>(maxWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxWidth + 50}px)`);
    const { rewards } = useINVEscrowRewards(escrow);
    const { data, isLoading, walletSupportsEvents } = useFirmUserPositionEvolution(market, 'comboPrice', rewards);

    useEffect(() => {
        setChartWidth(isLargerThan ? maxWidth : (screen.availWidth || screen.width) - 50)
    }, [isLargerThan, maxWidth]);

    if (!escrow || escrow === BURN_ADDRESS) {
        return null
    }

    return <WorthEvoChartSimplified
        isLoading={isLoading}
        market={market}
        chartWidth={chartWidth}
        data={data}
        priceRef={'comboPrice'}
    />
}

const DashBoardCard = (props: StackProps & { href?: string }) => {
    if (props.href) {
        return <Popover trigger="hover">
            <PopoverTrigger>
                <Stack direction={'row'} borderRadius="5px" bgColor="white" p="8" alignItems="center" boxShadow="0 4px 5px 5px #33333322" {...props} />
            </PopoverTrigger>
            <PopoverContent border="1px solid #ccc" _focus={{ outline: 'none' }} maxW="70px">
                <PopoverBody>
                    <Link href={props.href}>
                        Go to
                    </Link>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    }
    // return <Stack position="relative" direction={'row'} borderRadius="5px" bgColor="white" p="8" alignItems="center" boxShadow="0 4px 5px 5px #33333322" {...props} />
    return <Flex
        w="full"
        borderRadius={8}
        mt={0}
        p={8}
        position="relative"
        alignItems="center"
        shadow="0 0 0px 1px rgba(0, 0, 0, 0.25)"
        bg={'containerContentBackground'}
        {...props}
    />
}

const NumberItem = ({ noDataFallback = '-', footer = undefined, isLoading = false, value = 0, price = undefined, label = '', isUsd = false, precision = 0 }) => {
    return <VStack spacing="0" justify="center" alignItems="flex-end" w='full'>
        <VStack alignItems="flex-end" spacing="2">
            {
                isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize={price ? '28px' : '36px'} color={'mainTextColor'}>
                    {!value ? noDataFallback : value > 100000 ? smartShortNumber(value, 2, isUsd) : preciseCommify(value, precision, isUsd)}{!!price && !!value ? ` (${smartShortNumber(value * price, 2, true)})` : ''}
                </Text>
            }
            {
                (!!value || (!value && noDataFallback === '-')) && <Text fontSize="20px" fontWeight="bold" color={'mainTextColorLight'}>{label}</Text>
            }
        </VStack>
        {footer}
    </VStack>
}

const NumberCard = ({ imageSrc = '', noDataFallback = undefined, href = undefined, footer = undefined, isLoading = false, value = 0, label = '', price = undefined, isUsd = false, precision = 0 }) => {
    return <DashBoardCard href={href}>
        {!!imageSrc && <Image borderRadius="50px" src={imageSrc} w="30px" h="30px" position="absolute" left="10px" top="10px" />}
        <NumberItem noDataFallback={noDataFallback} isLoading={isLoading} price={price} value={value} label={label} isUsd={isUsd} precision={precision} footer={footer} />
    </DashBoardCard>
}

const StringItem = ({ footer = undefined, color = 'mainTextColor', value = '', label = '', isLoading = false }) => {
    return <VStack spacing="0" justify="center" alignItems="flex-end" w='full'>
        <VStack alignItems="flex-end" w='full' spacing="2">
            {
                isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize="36px" color={color}>{value}</Text>
            }
            <Text fontSize="20px" fontWeight="bold" color={'mainTextColorLight'}>{label}</Text>
            {footer}
        </VStack>
    </VStack>
}

const StringCard = ({ footer = undefined, color = undefined, value = '', label = '', isLoading = false }) => {
    return <DashBoardCard>
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

const NumberAndPieCard = ({ isLoading, noDataFallback = undefined, fill, activeFill, data, value, label, width = 350, height = 250, dataKey = 'value', nameKey = 'name', precision = 2, isUsd = false }) => {
    return <DashBoardCard minH="314px" direction={{ base: 'column', sm: 'row' }} alignItems="center" justify="space-around" px="16">
        {
            !isLoading && !data?.length ? noDataFallback : <PieItem fill={fill} activeFill={activeFill} data={data} width={width} height={height} dataKey={dataKey} nameKey={nameKey} precision={precision} isUsd={isUsd} />
        }
        <NumberItem isLoading={isLoading} value={value} label={label} precision={precision} isUsd={isUsd} />
    </DashBoardCard>
}

const CardFooter = ({ labelLeft = '', labelRight = '' }) => {
    return <HStack position="absolute" left="0" right="0" px="8" bottom="8px" w='full' justify="space-between">
        <Text color={'mainTextColorLight'} fontSize="14px">
            {labelLeft}
        </Text>
        <Text color={'mainTextColorLight'} fontSize="14px">
            {labelRight}
        </Text>
    </HStack>
}

const CallToAction = ({ href = '', ...props }) => {
    return <RSubmitButton px="8" h="60px" fontSize="28px" fontWeight="bold" {...props} />
}

const SmallCallToAction = ({ href = '', ...props }) => {
    return <RSubmitButton fontSize="18px" {...props} />
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
const StakeINV = <BigLinkBtn href="/firm">Stake INV</BigLinkBtn>;
const StakeDOLA = <BigLinkBtn disabled={true} href="/sdola">Stake DOLA</BigLinkBtn>;

export const UserDashboard = ({
    account
}: {
    account: string
}) => {
    const { markets, isLoading: isLoadingMarkets } = useDBRMarkets();
    const { prices, isLoading: isLoadingPrices } = usePrices();
    const { priceUsd: dbrPrice } = useDBRPrice();
    const accountMarkets = useAccountF2Markets(markets, account);
    const stakedDolaBalance = 0;
    const invMarket = accountMarkets?.find(m => m.isInv);
    const { themeStyles } = useAppTheme();
    const { stakedInFirm, isLoading: isLoadingInvStaked } = useStakedInFirm(account);
    const { debt, dbrExpiryDate, signedBalance: dbrBalance, needsRechargeSoon, isLoading: isLoadingAccount } = useAccountDBR(account);

    const isLoading = !account ? false : isLoadingMarkets || isLoadingAccount || isLoadingInvStaked || isLoadingPrices;

    const totalTotalSuppliedUsd = accountMarkets.reduce((prev, curr) => prev + curr.deposits * curr.price, 0);
    const marketsWithDeposits = accountMarkets.filter(m => m.depositsUsd > 1).sort((a, b) => b.depositsUsd - a.depositsUsd);
    const marketsWithDebt = accountMarkets.filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt);

    return <VStack w='full' spacing="8">
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="8" w="100%" >
            <NumberAndPieCard noDataFallback={SupplyAssets} isLoading={isLoading} fill={themeStyles.colors.mainTextColorLight} activeFill={themeStyles.colors.mainTextColor} value={totalTotalSuppliedUsd} label="My deposits" precision={0} isUsd={true} data={marketsWithDeposits} dataKey="depositsUsd" />
            <NumberAndPieCard noDataFallback={BorrowDola} isLoading={isLoading} fill={themeStyles.colors.warning} activeFill={themeStyles.colors.error} value={debt} label="My DOLA debt" precision={0} isUsd={false} data={marketsWithDebt} dataKey="debt" />
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, sm: 4 }} spacing="8" w="100%">
            <NumberCard imageSrc={TOKEN_IMAGES.INV} footer={
                <CardFooter
                    labelLeft={<>INV APR: <b>{shortenNumber(invMarket?.supplyApy, 2)}%</b></>}
                    labelRight={<>DBR APR: <b>{shortenNumber(invMarket?.dbrApr, 2)}%</b></>}
                />
            } noDataFallback={StakeINV} isLoading={isLoading} price={prices?.['inverse-finance']?.usd} value={stakedInFirm} label="INV staked in FiRM" precision={2} />
            {/* <NumberCard footer={
                <CardFooter
                    labelRight={<>sDOLA APY: <b>{shortenNumber(5, 2)}%</b></>}
                />
            } noDataFallback={StakeDOLA} isLoading={isLoading} value={stakedDolaBalance} label="DOLA staked" precision={0} /> */}
            <NumberCard imageSrc={TOKEN_IMAGES.DOLA} footer={
                <CardFooter
                    labelRight={<>Coming soon</>}
                />
            } noDataFallback={StakeDOLA} isLoading={isLoading} value={stakedDolaBalance} label="DOLA staked" precision={0} />
            <NumberCard
                imageSrc={TOKEN_IMAGES.DBR}
                footer={
                    <CardFooter
                        labelRight={<>Price: <b>{shortenNumber(dbrPrice, 4, true)}</b></>}
                    />
                }
                isLoading={isLoading} price={dbrPrice} value={dbrBalance} label="DBR balance" precision={0} />
            <StringCard footer={
                <CardFooter
                    labelLeft={<Link isExternal target="_blank" textDecoration="underline" href={BUY_LINKS.DBR}>Buy via DEX</Link>}
                    labelRight={<Link textDecoration="underline" href="/dbr/auction">Buy via auctions</Link>}
                />
            } color={needsRechargeSoon ? 'error' : undefined} isLoading={isLoading} value={debt > 0 ? dbrBalance < 0 ? 'Depleted' : moment(dbrExpiryDate).format('MMM Do YYYY') : '-'} label="DBR depletion date" />
        </SimpleGrid>
        {
            invMarket?.depositsUsd > 1 && <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="8" w="100%">
                <DashBoardCard>
                    <FirmInvEvoChart market={invMarket} />
                </DashBoardCard>
            </SimpleGrid>
        }
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing="8" w="100%">
            {
                marketsWithDeposits
                    .filter(market => market.hasClaimableRewards)
                    .map(market => {
                        // via on chain data
                        if (market.escrow && market.escrow !== BURN_ADDRESS && (market.isInv || market.name === 'cvxFXS' || market.name === 'cvxCRV')) {
                            return <FirmRewardWrapper
                                key={market.address}
                                market={market}
                                showMarketBtn={true}
                                extraAtBottom={true}
                                escrow={market.escrow}
                            />
                        }
                    })
            }
        </SimpleGrid>
    </VStack>
}
