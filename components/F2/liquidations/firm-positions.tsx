import { HStack, Stack, StackProps, Text, useDisclosure, useMediaQuery, VStack } from "@chakra-ui/react"
import { shortenNumber } from "@app/util/markets";
import Container from "@app/components/common/Container";
import { getRiskColor } from "@app/util/f2";
import { useFirmPositions } from "@app/hooks/useFirm";

import { useState } from "react";
import { FirmLiquidationModal } from "./FirmLiquidationModal";
import { Funds } from "@app/components/Transparency/Funds";
import { BarChart } from "@app/components/Transparency/BarChart";
import { SkeletonBlob } from "@app/components/common/Skeleton";
import { SmallTextLoader } from "@app/components/common/Loaders/SmallTextLoader";
import { FirmPositionsTable } from "../Infos/FirmPositionsTable";
import { DashBoardCard } from '@app/components/F2/UserDashboard'
import { timeSince } from "@app/util/time";

export const groupPositionsBy = (positions: any[], groupBy: string, attributeToSum: string, trueLabel = 'With Fed', falseLabel = 'Without Fed') => {
    return Object.entries(
        positions.reduce((prev, curr) => {
            return { ...prev, [curr[groupBy]]: (prev[curr[groupBy]] || 0) + curr[attributeToSum] };
        }, {})
    ).map(([key, val]) => {
        const symbol = key.replace('true', trueLabel).replace('false', falseLabel);
        return { balance: val, usdPrice: 1, token: { symbol } }
    });
}

export const FirmMarketsStats = ({
    positions,
    isLoading,
}: {
    positions: any[]
    isLoading: boolean
}) => {
    const [isLargerThan] = useMediaQuery(`(min-width: 48em)`);

    const pieSize = isLargerThan ? 300 : 250;

    const totalTvl = positions.reduce((prev, curr) => prev + (curr.deposits * curr.market.price), 0);
    const totalDebt = positions.reduce((prev, curr) => prev + curr.debt, 0);
    const avgHealth = positions?.length > 0 && totalDebt > 0 ? positions.reduce((prev, curr) => prev + curr.debtRiskWeight, 0) / totalDebt : 100;
    const avgRiskColor = getRiskColor(avgHealth);

    const positionsWithDebt = positions.filter(p => p.debt > 0);
    const positionsWithDeposits = positions.filter(p => p.deposits > 0);
    const groupMarketsByDeposits = groupPositionsBy(positionsWithDeposits, 'marketName', 'tvl');
    // const groupMarketsByDebt = groupPositionsBy(positionsWithDebt, 'marketName', 'debt');
    const groupMarketsByStable = groupPositionsBy(positionsWithDebt, 'isStableMarket', 'debt', 'Stable Collaterals', 'Volatile Collaterals');

    return <VStack w='full' alignItems="center">
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
        <VStack direction={{ base: 'column', md: 'row' }} w='full' justify="space-around" >
            <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-around" >
                <VStack spacing="0" alignItems={{ base: 'center', md: 'center' }} direction="column-reverse">
                    <Text color="secondaryTextColor" fontWeight="bold" fontSize="22px">TVL By Markets</Text>
                    <Funds isLoading={isLoading} labelWithPercInChart={true} skipLineForPerc={true} funds={groupMarketsByDeposits} chartMode={true} showTotal={false} showChartTotal={true} chartProps={{ width: pieSize, height: pieSize }} useRecharts={true} />
                </VStack>
                <VStack spacing="0" alignItems={{ base: 'center', md: 'center' }} direction="column-reverse">
                    <Text color="secondaryTextColor" fontWeight="bold" fontSize="22px">Debt Backing</Text>
                    <Funds isLoading={isLoading} labelWithPercInChart={true} skipLineForPerc={true} funds={groupMarketsByStable} chartMode={true} showTotal={false} showChartTotal={true} chartProps={{ width: pieSize, height: pieSize }} useRecharts={true} />
                </VStack>
            </Stack>
        </VStack>
    </VStack>
}

export const FirmPositions = ({
    positions,
    isLoading,
    timestamp,
    containerProps,
    ...props
}: {
    positions: any[]
    isLoading: boolean
    timestamp: number
    containerProps?: any
} & StackProps) => {
    const { onOpen, onClose, isOpen } = useDisclosure();
    const [position, setPosition] = useState(null);

    const openLiquidation = async (data) => {
        setPosition(data);
        onOpen();
    }

    return <VStack w='full' alignItems="center" {...props}>
        <Container
            label="FiRM Positions"
            description={timestamp ? `Last update ${timeSince(timestamp)}` : `Loading...`}
            contentProps={{ maxW: { base: '90vw', sm: '100%' }, overflowX: 'auto' }}
            headerProps={{
                direction: { base: 'column', md: 'row' },
                align: { base: 'flex-start', md: 'flex-end' },
            }}
            {...containerProps}
        >
            {
                !!position && <FirmLiquidationModal onClose={onClose} isOpen={isOpen} position={position} />
            }
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <FirmPositionsTable positions={positions} onClick={openLiquidation} />
            }
        </Container>
    </VStack>
}

export const FirmPositionsOld = ({
    vnetPublicId
}: {
    vnetPublicId?: string
}) => {
    const { positions, timestamp, isLoading } = useFirmPositions(vnetPublicId);
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

    return <VStack w='full' alignItems="center">
        <FirmMarketsStats positions={positions} isLoading={isLoading} />
        <Container
            label="FiRM Positions"
            description={timestamp ? `Last update ${timeSince(timestamp)}` : `Loading...`}
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
                !!position && <FirmLiquidationModal onClose={onClose} isOpen={isOpen} position={position} />
            }
            {
                isLoading ?
                    <SkeletonBlob />
                    :
                    <FirmPositionsTable positions={positions} onClick={openLiquidation} />
            }
        </Container>
    </VStack>
}