import { SimpleGrid, Stack, StackProps, Text, VStack, HStack } from "@chakra-ui/react"
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { useAccountDBR, useAccountF2Markets, useDBRMarkets, useDBRPrice } from '@app/hooks/useDBR';
import { useAccount } from '@app/hooks/misc';
import { SkeletonList } from "@app/components/common/Skeleton";
import { preciseCommify } from "@app/util/misc";
import { lightTheme } from "@app/variables/theme";
import moment from "moment";
import { PieChartRecharts } from "../Transparency/PieChartRecharts";
import { useStakedInFirm } from "@app/hooks/useFirm";
import { usePrices } from "@app/hooks/usePrices";
import { BigTextLoader } from "../common/Loaders/BigTextLoader";

const DashBoardCard = (props: StackProps) => {
    return <Stack direction={'row'} borderRadius="5px" bgColor="white" p="8" alignItems="center" boxShadow="0 4px 5px 5px #33333322" {...props} />
}

const NumberItem = ({ footer = undefined, isLoading = false, value = 0, price = undefined, label = '', isUsd = false, precision = 0 }) => {
    return <VStack position="relative" spacing="0" justify="center" alignItems="flex-end" w='full'>
        <VStack alignItems="flex-end" spacing="2">
            {
                isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize={price ? '28px' : '36px'} color={lightTheme.colors.mainTextColor}>
                    {!value ? '-' : value > 100000 ? smartShortNumber(value, 2, isUsd) : preciseCommify(value, precision, isUsd)}{!!price && !!value ? ` (${smartShortNumber(value * price, 2, true)})` : ''}
                </Text>
            }
            <Text fontSize="20px" fontWeight="bold" color={lightTheme.colors.mainTextColorLight}>{label}</Text>
        </VStack>
        {footer}
    </VStack>
}

const NumberCard = ({ footer = undefined, isLoading = false, value = 0, label = '', price = undefined, isUsd = false, precision = 0 }) => {
    return <DashBoardCard>
        <NumberItem isLoading={isLoading} price={price} value={value} label={label} isUsd={isUsd} precision={precision} footer={footer} />
    </DashBoardCard>
}

const StringItem = ({ value = '', label = '', isLoading = false }) => {
    return <VStack alignItems="flex-end" w='full'>
        {
            isLoading ? <BigTextLoader /> : <Text fontWeight="extrabold" fontSize="36px" color={lightTheme.colors.mainTextColor}>{value}</Text>
        }
        <Text fontSize="20px" fontWeight="bold" color={lightTheme.colors.mainTextColorLight}>{label}</Text>
    </VStack>
}

const StringCard = ({ value = '', label = '', isLoading = false }) => {
    return <DashBoardCard>
        <StringItem isLoading={isLoading} value={value} label={label} />
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

const NumberAndPieCard = ({ isLoading, fill, activeFill, data, value, label, width = 350, height = 250, dataKey = 'value', nameKey = 'name', precision = 2, isUsd = false }) => {
    return <DashBoardCard alignItems="center" justify="space-around" px="16">
        <PieItem fill={fill} activeFill={activeFill} data={data} width={width} height={height} dataKey={dataKey} nameKey={nameKey} precision={precision} isUsd={isUsd} />
        <NumberItem isLoading={isLoading} value={value} label={label} precision={precision} isUsd={isUsd} />
    </DashBoardCard>
}

export const UserDashboard = ({
    account
}: {
    account: string
}) => {
    const { markets, isLoading } = useDBRMarkets();
    const { prices } = usePrices();
    const { priceUsd: dbrPrice } = useDBRPrice();
    const accountMarkets = useAccountF2Markets(markets, account);
    const invMarket = markets?.find(m => m.isInv);
    const { stakedInFirm } = useStakedInFirm(account);
    const { debt, dbrExpiryDate, signedBalance: dbrBalance } = useAccountDBR(account);

    const totalTotalSuppliedUsd = accountMarkets.reduce((prev, curr) => prev + curr.deposits * curr.price, 0);
    const marketsWithDeposits = accountMarkets.filter(m => m.depositsUsd > 1).sort((a, b) => b.depositsUsd - a.depositsUsd);
    const marketsWithDebt = accountMarkets.filter(m => m.debt > 0).sort((a, b) => b.debt - a.debt);

    return <VStack w='full'>
        {
            isLoading ?
                <SkeletonList /> :
                <>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} pb="4" spacing="8" w="100%" >
                        <NumberAndPieCard isLoading={isLoading} value={totalTotalSuppliedUsd} label="My collaterals" precision={0} isUsd={true} data={marketsWithDeposits} dataKey="depositsUsd" />
                        <NumberAndPieCard isLoading={isLoading} fill={lightTheme.colors.warning} activeFill={lightTheme.colors.error} value={debt} label="My DOLA debt" precision={0} isUsd={false} data={marketsWithDebt} dataKey="debt" />
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, sm: 4 }} pb="4" spacing="8" w="100%" >
                        <NumberCard footer={<HStack position="absolute" bottom="-25px" w='full' justify="space-between">
                            <Text color={lightTheme.colors.mainTextColorLight} fontSize="14px">
                                INV APR: <b>{shortenNumber(invMarket?.supplyApy, 2)}%</b>
                            </Text>
                            <Text color={lightTheme.colors.mainTextColorLight} fontSize="14px">
                                DBR APR: <b>{shortenNumber(invMarket?.dbrApr, 2)}%</b>
                            </Text>
                        </HStack>} isLoading={isLoading} price={prices?.['inverse-finance']?.usd} value={stakedInFirm} label="INV staked in FiRM" precision={0} />
                        <NumberCard isLoading={isLoading} value={8000} label="DOLA staked" precision={0} />
                        <NumberCard isLoading={isLoading} price={dbrPrice} value={dbrBalance} label="DBR balance" precision={0} />
                        <StringCard isLoading={isLoading} value={debt > 0 ? moment(dbrExpiryDate).format('MMM Do YYYY') : '-'} label="DBR depletion date" />
                    </SimpleGrid>
                </>

        }
    </VStack>
}