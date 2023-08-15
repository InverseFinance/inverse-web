import { Flex, HStack, SkeletonText, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { getRiskColor } from "@app/util/f2";
import { BigImageButton } from "@app/components/common/Button/BigImageButton";
import { useFirmPositions } from "@app/hooks/useFirm";
import Link from "@app/components/common/Link";
import { ViewIcon } from "@chakra-ui/icons";
import ScannerLink from "@app/components/common/ScannerLink";
import moment from 'moment'
import { useState } from "react";
import Table from "@app/components/common/Table";
import { Funds } from "@app/components/Transparency/Funds";
import { BarChart } from "@app/components/Transparency/BarChart";
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { MarketImage } from "@app/components/common/Assets/MarketImage";

const groupPositionsBy = (positions: any[], groupBy: string, attributeToSum: string) => {
    return Object.entries(
        positions.reduce((prev, curr) => {
            return { ...prev, [curr[groupBy]]: (prev[curr[groupBy]] || 0) + curr[attributeToSum] };
        }, {})
    ).map(([key, val]) => {
        const symbol = key.replace('true', 'With Fed').replace('false', 'Without Fed');
        return { balance: val, usdPrice: 1, token: { symbol } }
    });
}

const ColHeader = ({ ...props }) => {
    return <Flex justify="flex-start" minWidth={'100px'} fontSize="14px" fontWeight="extrabold" {...props} />
}

const Cell = ({ ...props }) => {
    return <Stack direction="row" fontSize="14px" fontWeight="normal" justify="flex-start" minWidth="100px" {...props} />
}

const CellText = ({ ...props }) => {
    return <Text fontSize="16px" {...props} />
}

const columns = [
    {
        field: 'user',
        label: 'User',
        header: ({ ...props }) => <ColHeader justify="flex-start" {...props} minWidth="130px" />,
        value: ({ user }) => {
            return <Cell w="130px" justify="flex-start" position="relative" onClick={(e) => e.stopPropagation()}>
                <Link isExternal href={`/firm?viewAddress=${user}`}>
                    <ViewIcon color="blue.600" boxSize={3} />
                </Link>
                <ScannerLink value={user} />
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'stakedInvUsd',
        label: 'INV staked',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ stakedInvUsd }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">                
                <CellText>{stakedInvUsd > 0 ? shortenNumber(stakedInvUsd, 2, true) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'depositsUsd',
        label: 'Deposits',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ depositsUsd }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">                
                <CellText>{shortenNumber(depositsUsd, 2, true)}</CellText>
            </Cell>
        },
    },
    {
        field: 'creditLimit',
        label: 'Max Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ creditLimit }) => {
            return <Cell minWidth="100px" justify="center" alignItems="center" direction="column" spacing="0">                
                <CellText>{creditLimit > 0 ? shortenNumber(creditLimit, 2, true): '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'debt',
        label: 'Debt',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ debt }) => {
            return <Cell minWidth="100px" justify="center" >
                <CellText>{debt > 0 ? shortenNumber(debt, 2) : '-'}</CellText>
            </Cell>
        },
    },
    {
        field: 'isLiquidatable',
        label: 'In shortfall?',
        header: ({ ...props }) => <ColHeader minWidth="150px" alignItems="center" justify="center"  {...props} />,
        value: ({ isLiquidatable }) => {
            return <Cell minWidth="150px" justify="center" direction="column" alignItems="center">
                <CellText color={isLiquidatable ? 'error' : 'mainTextColor'}>{isLiquidatable ? 'Yes' : 'No'}</CellText>
            </Cell>
        },
        showFilter: true,
        filterWidth: '100px',
    },
    {
        field: 'liquidatableDebt',
        label: 'Seizable',
        header: ({ ...props }) => <ColHeader minWidth="150px" alignItems="center" justify="center"  {...props} />,
        value: ({ seizableWorth, liquidatableDebt }) => {
            return <Cell minWidth="150px" justify="center" direction="column" alignItems="center">
                {
                    liquidatableDebt > 0 ? <>                        
                        <CellText>~{shortenNumber(liquidatableDebt, 2)} DOLA</CellText>
                    </> : <CellText>-</CellText>
                }
            </Cell>
        },
    },
    {
        field: 'marketRelativeDebtSizes',
        label: 'Relative Debts',
        header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
        value: ({ marketIcons, marketRelativeDebtSizes }) => {
            return <Cell minWidth="100px" justify="center">
                {marketRelativeDebtSizes.map((size, i) => <MarketImage imgProps={{ title: `${size*100}%`, display: size > 0 ? 'inline-block' : 'none' }} key={marketIcons[i]} image={marketIcons[i]} size={(size*10+10)} />)}
            </Cell>
        },
    },
    // {
    //     field: 'marketRelativeCollateralSizes',
    //     label: 'Collateral sizes',
    //     header: ({ ...props }) => <ColHeader minWidth="100px" justify="center"  {...props} />,
    //     value: ({ marketIcons, marketRelativeCollateralSizes }) => {
    //         return <Cell minWidth="100px" justify="center">
    //             {marketRelativeCollateralSizes.map((size, i) => <MarketImage imgProps={{ title: `${size*100}%`, display: size > 0 ? 'inline-block' : 'none' }} key={marketIcons[i]} image={marketIcons[i]} size={(size*10+10)} />)}
    //         </Cell>
    //     },
    // },
    {
        field: 'avgBorrowLimit',
        label: 'Avg Borrow Limit',
        header: ({ ...props }) => <ColHeader minWidth="150px" justify="flex-end"  {...props} />,        
        value: ({ debt, avgBorrowLimit }) => {
            const color = getRiskColor(100-avgBorrowLimit);
            return <Cell minWidth="150px" justify="flex-end" >
                <CellText color={debt > 0 ? color : undefined}>{debt > 0 ? `${shortenNumber(avgBorrowLimit, 2)}%` : '-'}</CellText>
            </Cell>
        },
    },
]

export const FirmUsers = ({

}: {

    }) => {
    const { positions, timestamp, isLoading } = useFirmPositions();
    const uniqueUsers = [...new Set(positions.map(d => d.user))];
    const positionsAggregatedByUser = uniqueUsers.map(user => {
        const userPositions = positions.filter(p => p.user === user);
        const debt = userPositions.reduce((prev, curr) => prev + (curr.debt), 0);
        const creditLimit = userPositions.reduce((prev, curr) => prev + (curr.creditLimit), 0);
        const liquidatableDebt = userPositions.reduce((prev, curr) => prev + (curr.liquidatableDebt), 0);
        return {
            user,
            depositsUsd: userPositions.reduce((prev, curr) => prev + (curr.tvl), 0),
            liquidatableDebt,
            isLiquidatable: liquidatableDebt > 0,
            debt,
            avgBorrowLimit: debt > 0 ? userPositions.reduce((prev, curr) => prev + curr.debtRiskWeight, 0) / debt : 0,
            marketIcons: userPositions?.map(p => p.market.underlying.image) || [],
            marketRelativeDebtSizes: userPositions?.map(p => p.debt > 0 ? p.debt/debt : 0),
            marketRelativeCollateralSizes: userPositions?.map(p => p.creditLimit > 0 ? p.creditLimit/creditLimit : 0),
            creditLimit: userPositions.reduce((prev, curr) => prev + (curr.creditLimit), 0),
            stakedInv: userPositions.filter(p => p.market.isInv).reduce((prev, curr) => prev + (curr.deposits), 0),
            stakedInvUsd: userPositions.filter(p => p.market.isInv).reduce((prev, curr) => prev + (curr.tvl), 0),
        }
    });
    const { onOpen, onClose, isOpen } = useDisclosure();
    const [position, setPosition] = useState(null);

    const openLiquidation = async (data) => {
        setPosition(data);
        onOpen();
    }

    const totalTvl = positions.reduce((prev, curr) => prev + (curr.deposits * curr.market.price), 0);
    const totalDebt = positions.reduce((prev, curr) => prev + curr.debt, 0);
    const avgHealth = positions?.length > 0 && totalDebt > 0 ? positions.reduce((prev, curr) => prev + curr.debtRiskWeight, 0) / totalDebt : 100;
    const avgRiskColor = getRiskColor(avgHealth);

    const positionsWithDebt = positions.filter(p => p.debt > 0);
    const positionsWithDeposits = positions.filter(p => p.deposits > 0);
    const groupMarketsByDeposits = groupPositionsBy(positionsWithDeposits, 'marketName', 'tvl');
    const groupMarketsByDebt = groupPositionsBy(positionsWithDebt, 'marketName', 'debt');
    const groupMarketsByBorrowLimit = groupPositionsBy(positionsWithDebt, 'marketName', 'debtRiskWeight').map((f, i) => ({ ...f, balance: 100 - f.balance / groupMarketsByDebt[i].balance }));
    const barData = groupMarketsByBorrowLimit.map(d => {
        return [{ x: d.token.symbol, y: d.balance, label: `${shortenNumber(d.balance, 2)}%` }];
    })
    const barColors = groupMarketsByBorrowLimit.map(f => getRiskColor(100 - f.balance));

    return <VStack w='full'>
        <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-around" >
            <VStack alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
                <Text fontWeight="bold">Avg Borrow Limit By Markets</Text>
                <BarChart
                    width={450}
                    height={300}
                    isPercentages={true}
                    groupedData={barData}
                    colorScale={barColors}
                    isDollars={false}
                />
            </VStack>
            <VStack alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
                <Text fontWeight="bold">TVL By Markets</Text>
                <Funds labelWithPercInChart={true} funds={groupMarketsByDeposits} chartMode={true} showTotal={false} showChartTotal={true} />
            </VStack>
            <VStack alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
                <Text fontWeight="bold">Debt By Markets</Text>
                <Funds labelWithPercInChart={true} funds={groupMarketsByDebt} chartMode={true} showTotal={false} showChartTotal={true} />
            </VStack>
        </Stack>
        <Container
            label="FiRM Users"
            description={timestamp ? `Last update ${moment(timestamp).fromNow()}` : `Loading...`}
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
            }}
            right={
                <HStack justify="space-between" spacing="4">
                    <VStack alignItems={{ base: 'flex-start', sm: 'center' }}>
                        <Text fontWeight="bold">Avg Borrow Limit</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text color={avgRiskColor}>{shortenNumber(100 - avgHealth, 2)}%</Text>
                        }
                    </VStack>
                    <VStack alignItems="center">
                        <Text textAlign="center" fontWeight="bold">Total Value Locked</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text textAlign="center" color="secondaryTextColor">{shortenNumber(totalTvl, 2, true)}</Text>
                        }
                    </VStack>
                    <VStack alignItems="flex-end">
                        <Text textAlign="right" fontWeight="bold">Total Debt</Text>
                        {
                            isLoading ? <SmallTextLoader width={'50px'} />
                                : <Text textAlign="right" color="secondaryTextColor">{shortenNumber(totalDebt, 2, 0)}</Text>
                        }
                    </VStack>
                </HStack>
            }
        >
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <Table
                        keyName="user"
                        noDataMessage="No active user in last update"
                        columns={columns}
                        items={positionsAggregatedByUser}
                        defaultSort="debt"
                        defaultSortDir="desc"
                    />
            }
        </Container>
    </VStack>
}