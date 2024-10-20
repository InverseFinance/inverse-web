import { useDolaCirculatingSupplyEvolution, useDolaPrices, useDolaVolumes } from "@app/hooks/useDOLA"
import { Text, VStack, useMediaQuery } from "@chakra-ui/react";
import { DefaultCharts } from "./DefaultCharts";
import { SkeletonBlob } from "../common/Skeleton";
import Container from "../common/Container";
import { useEffect, useMemo, useState } from "react";
import { shortenNumber } from "@app/util/markets";
import { useDOLAPrice } from "@app/hooks/usePrices";

const maxChartWidth = 1300

export const DolaCircSupplyEvolution = () => {
    const { evolution, isLoading, currentCirculatingSupply } = useDolaCirculatingSupplyEvolution();
    const { evolution: priceEvolution } = useDolaPrices();
    const todayUtcDate = useMemo(() => new Date().toISOString().substring(0, 10), []);
    
    const evolutionWithPrice = evolution.map(d => {
        const price = priceEvolution.find(e => e.utcDate === d.utcDate)
        return { ...d, mkcap: (price?.y || 1) * d.y }
    }).filter(d => d.utcDate <= todayUtcDate);

    const currentMkcap = evolutionWithPrice?.length ? evolutionWithPrice[evolutionWithPrice.length-1].mkcap : 0;

    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    const fontSize = { base: '16px', sm: '28px' };
    const fontSize2 = { base: '13px', sm: '16px' };

    return <Container
        noPadding
        m="0"
        p="0"
        label="DOLA Circulating Supply Evolution"
        description="Excluded from circulation: DOLAs sitting in FiRM markets, anDOLA and in Fed Farmers; Precision: daily on mainnet, weekly on L2s"
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            currentCirculatingSupply && <VStack spacing="0" alignItems={{ base: 'flex-start', md: 'flex-end' }}>
                <Text textAlign="right" fontSize={fontSize} fontWeight="extrabold">{currentMkcap ? shortenNumber(currentMkcap, 2, true) : '-'}</Text>
                <Text fontWeight="bold" textAlign="right" fontSize={fontSize2} color="accentTextColor">Current Circulating Supply</Text>
            </VStack>
        }
    >
        <VStack pt="10" position="relative">
            {
                isLoading ? <SkeletonBlob />
                    : <DefaultCharts
                        showMonthlyBarChart={false}
                        maxChartWidth={autoChartWidth}
                        chartWidth={autoChartWidth}
                        chartData={evolutionWithPrice}
                        isDollars={false}
                        smoothLineByDefault={true}
                        barProps={{ eventName: 'Circ. Supply' }}
                        areaProps={{ id: 'dola-circ-supply-chart', duplicateYAxis: false, secondaryAsUsd: true, secondaryOpacity: 0, showSecondary: true, secondaryLabel: 'Market Cap', secondaryRef: 'mkcap', showRangeBtns: true, yLabel: 'DOLA Circ. supply', useRecharts: true, simplifyData: true, domainYpadding: 1000000, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
                    />
            }
        </VStack>
    </Container>
}