import { HStack, Stack, Text, useDisclosure, useMediaQuery, VStack } from "@chakra-ui/react"
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

export const FirmPositions = ({
    vnetPublicId
}: {
    vnetPublicId?: string
}) => {
    const { positions, timestamp, isLoading, markets } = useFirmPositions(vnetPublicId);
    const { onOpen, onClose, isOpen } = useDisclosure();
    const [position, setPosition] = useState(null);
    const [isLargerThan] = useMediaQuery(`(min-width: 48em)`);

    const pieSize = isLargerThan ? 300 : 250;

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
    const groupMarketsByStable = groupPositionsBy(positionsWithDebt, 'isStableMarket', 'debt', 'Stable Collaterals', 'Volatile Collaterals');
    const barData = groupMarketsByBorrowLimit.map(d => {
        return [{ x: d.token.symbol, y: d.balance, label: `${shortenNumber(d.balance, 2)}%` }];
    })
    const barColors = groupMarketsByBorrowLimit.map(f => getRiskColor(100 - f.balance));

    return <VStack w='full' alignItems="center">
        <VStack direction={{ base: 'column', md: 'row' }} w='full' justify="space-around" >
            <Stack direction={{ base: 'column', md: 'row' }} w='full' justify="space-around" >
                <VStack spacing="0" alignItems={{ base: 'center', md: 'center' }} direction="column-reverse">
                    <Text color="secondaryTextColor" fontWeight="bold" fontSize="22px">TVL By Markets</Text>
                    <Funds isLoading={isLoading} labelWithPercInChart={true} skipLineForPerc={true} funds={groupMarketsByDeposits} chartMode={true} showTotal={false} showChartTotal={true} chartProps={{ width: pieSize, height: pieSize }} useRecharts={true} />
                </VStack>
                {/* <VStack spacing="0" alignItems={{ base: 'center', md: 'flex-start' }} direction="column-reverse">
                    <Text fontWeight="bold" fontSize="18px">Debt By Markets</Text>
                    <Funds isLoading={isLoading} labelWithPercInChart={true} skipLineForPerc={true} funds={groupMarketsByDebt} chartMode={true} showTotal={false} showChartTotal={true} chartProps={{ width: pieSize, height: pieSize }} useRecharts={true} />
                </VStack> */}
                <VStack spacing="0" alignItems={{ base: 'center', md: 'center' }} direction="column-reverse">
                    <Text color="secondaryTextColor" fontWeight="bold" fontSize="22px">Debt Backing</Text>
                    <Funds isLoading={isLoading} labelWithPercInChart={true} skipLineForPerc={true} funds={groupMarketsByStable} chartMode={true} showTotal={false} showChartTotal={true} chartProps={{ width: pieSize, height: pieSize }} useRecharts={true} />
                </VStack>
            </Stack>
        </VStack>
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