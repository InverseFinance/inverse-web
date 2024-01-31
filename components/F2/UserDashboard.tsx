import { SimpleGrid, Stack, StackProps, Text, VStack, HStack, Popover, PopoverTrigger, PopoverContent, PopoverBody } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { useAccountDBR, useAccountF2Markets, useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR';
import { SkeletonList } from "@app/components/common/Skeleton";
import { preciseCommify } from "@app/util/misc";
import { lightTheme } from "@app/variables/theme";
import moment from "moment";
import { PieChartRecharts } from "../Transparency/PieChartRecharts";
import { useStakedInFirm } from "@app/hooks/useFirm";
import { usePrices } from "@app/hooks/usePrices";
import { BigTextLoader } from "../common/Loaders/BigTextLoader";
import { RSubmitButton } from "../common/Button/RSubmitButton";
import Link from "../common/Link";


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
    return <Stack position="relative" direction={'row'} borderRadius="5px" bgColor="white" p="8" alignItems="center" boxShadow="0 4px 5px 5px #33333322" {...props} />
}

const NumberItem = ({ noDataFallback = '-', footer = undefined, isLoading = false, value = 0, price = undefined, label = '', isUsd = false, precision = 0 }) => {
    return <VStack spacing="0" justify="center" alignItems="flex-end" w='full'>
        <VStack alignItems="flex-end" spacing="2">
            {
                isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize={price ? '28px' : '36px'} color={lightTheme.colors.mainTextColor}>
                    {!value ? noDataFallback : value > 100000 ? smartShortNumber(value, 2, isUsd) : preciseCommify(value, precision, isUsd)}{!!price && !!value ? ` (${smartShortNumber(value * price, 2, true)})` : ''}
                </Text>
            }
            {
                (!!value || (!value && noDataFallback === '-')) && <Text fontSize="20px" fontWeight="bold" color={lightTheme.colors.mainTextColorLight}>{label}</Text>
            }
        </VStack>
        {footer}
    </VStack>
}

const NumberCard = ({ noDataFallback = undefined, href = undefined, footer = undefined, isLoading = false, value = 0, label = '', price = undefined, isUsd = false, precision = 0 }) => {
    return <DashBoardCard href={href}>
        <NumberItem noDataFallback={noDataFallback} isLoading={isLoading} price={price} value={value} label={label} isUsd={isUsd} precision={precision} footer={footer} />
    </DashBoardCard>
}

const StringItem = ({ color = lightTheme.colors.mainTextColor, value = '', label = '', isLoading = false }) => {
    return <VStack alignItems="flex-end" w='full'>
        {
            isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize="36px" color={color}>{value}</Text>
        }
        <Text fontSize="20px" fontWeight="bold" color={lightTheme.colors.mainTextColorLight}>{label}</Text>
    </VStack>
}

const StringCard = ({ color = undefined, value = '', label = '', isLoading = false }) => {
    return <DashBoardCard>
        <StringItem color={color} isLoading={isLoading} value={value} label={label} />
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
    return <DashBoardCard direction={{ base: 'column', sm: 'row' }} alignItems="center" justify="space-around" px="16">
        {
            !isLoading && !data?.length ? noDataFallback : <PieItem fill={fill} activeFill={activeFill} data={data} width={width} height={height} dataKey={dataKey} nameKey={nameKey} precision={precision} isUsd={isUsd} />
        }
        <NumberItem isLoading={isLoading} value={value} label={label} precision={precision} isUsd={isUsd} />
    </DashBoardCard>
}

const CardFooter = ({ labelLeft = '', labelRight = '' }) => {
    return <HStack position="absolute" left="0" right="0" px="8" bottom="8px" w='full' justify="space-between">
        <Text color={lightTheme.colors.mainTextColorLight} fontSize="14px">
            {labelLeft}
        </Text>
        <Text color={lightTheme.colors.mainTextColorLight} fontSize="14px">
            {labelRight}
        </Text>
    </HStack>
}

const CallToAction = ({ href = '', ...props }) => {
    return <RSubmitButton bgColor="accentTextColor" px="8" h="60px" fontSize="28px" fontWeight="bold" {...props} />
}

const SmallCallToAction = ({ href = '', ...props }) => {
    return <RSubmitButton fontSize="18px" bgColor="accentTextColor" {...props} />
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
    const invMarket = markets?.find(m => m.isInv);
    const { stakedInFirm, isLoading: isLoadingInvStaked } = useStakedInFirm(account);
    const { debt, dbrExpiryDate, signedBalance: dbrBalance, needsRechargeSoon, isLoading: isLoadingAccount } = useAccountDBR(account);    
    const isLoading = !account ? false : isLoadingMarkets || isLoadingAccount || isLoadingInvStaked || isLoadingPrices;

    const totalTotalSuppliedUsd = accountMarkets.reduce((prev, curr) => prev + curr.deposits * curr.price, 0);
    const marketsWithDeposits = accountMarkets.filter(m => m.depositsUsd > 1).sort((a, b) => b.depositsUsd - a.depositsUsd);
    const marketsWithDebt = accountMarkets.filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt);

    return <VStack w='full'>
        <SimpleGrid columns={{ base: 1, sm: 2 }} pb="4" spacing="8" w="100%" >
            <NumberAndPieCard noDataFallback={SupplyAssets} isLoading={isLoading} value={totalTotalSuppliedUsd} label="My deposits" precision={0} isUsd={true} data={marketsWithDeposits} dataKey="depositsUsd" />
            <NumberAndPieCard noDataFallback={BorrowDola} isLoading={isLoading} fill={lightTheme.colors.warning} activeFill={lightTheme.colors.error} value={debt} label="My DOLA debt" precision={0} isUsd={false} data={marketsWithDebt} dataKey="debt" />
        </SimpleGrid>
        <SimpleGrid columns={{ base: 1, sm: 4 }} pb="4" spacing="8" w="100%" >
            <NumberCard footer={
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
            <NumberCard footer={
                <CardFooter
                    labelRight={<>Coming soon</>}
                />
            } noDataFallback={StakeDOLA} isLoading={isLoading} value={stakedDolaBalance} label="DOLA staked" precision={0} />
            <NumberCard
                footer={
                    <CardFooter
                        labelRight={<>Price: <b>{shortenNumber(dbrPrice, 4, true)}</b></>}
                    />
                }
                isLoading={isLoading} price={dbrPrice} value={dbrBalance} label="DBR balance" precision={0} />
            <StringCard color={needsRechargeSoon ? 'error' : undefined} isLoading={isLoading} value={debt > 0 ? dbrBalance < 0 ? 'Depleted' : moment(dbrExpiryDate).format('MMM Do YYYY') : '-'} label="DBR depletion date" />
        </SimpleGrid>
    </VStack>
}