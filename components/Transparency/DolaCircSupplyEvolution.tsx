import { useDolaCirculatingSupplyEvolution } from "@app/hooks/useDOLA"
import { Text, VStack, useMediaQuery } from "@chakra-ui/react";
import { DefaultCharts } from "./DefaultCharts";
import { SkeletonBlob } from "../common/Skeleton";
import Container from "../common/Container";
import { useEffect, useState } from "react";

const maxChartWidth= 820

export const DolaCircSupplyEvolution = () => {
    const { evolution, isLoading, isError } = useDolaCirculatingSupplyEvolution();
    
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <Container noPadding m="0" p="0" label="DOLA Circulating Supply Evolution" description="Excluded from circulation: DOLAs sitting in markets and in Fed Farmers; Precision: daily on mainnet, weekly on L2s">
        <VStack pt="10" position="relative">
            {
                isLoading ? <SkeletonBlob />
                    : <DefaultCharts
                        showMonthlyBarChart={false}
                        maxChartWidth={autoChartWidth}
                        chartWidth={autoChartWidth}
                        chartData={evolution}
                        isDollars={false}
                        smoothLineByDefault={true}
                        barProps={{ eventName: 'Circ. Supply' }}
                        areaProps={{ id: 'dola-circ-supply-chart', showRangeBtns: true, yLabel: 'DOLA Circ. supply', useRecharts: true, simplifyData: true, domainYpadding: 1000000, showMaxY: false, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
                    />
            }
        </VStack>
    </Container>
}