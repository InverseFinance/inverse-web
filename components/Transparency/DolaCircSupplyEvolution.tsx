import { useDolaCirculatingSupplyEvolution } from "@app/hooks/useDOLA"
import { Text, VStack, useMediaQuery } from "@chakra-ui/react";
import { DefaultCharts } from "./DefaultCharts";
import { SkeletonBlob } from "../common/Skeleton";
import Container from "../common/Container";
import { useEffect, useState } from "react";
import { shortenNumber } from "@app/util/markets";
import { useDOLAPrice } from "@app/hooks/usePrices";

const maxChartWidth = 1300

export const DolaCircSupplyEvolution = () => {
    const { evolution, isLoading, currentCirculatingSupply } = useDolaCirculatingSupplyEvolution();
    const { price } = useDOLAPrice();

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
        description="Excluded from circulation: DOLAs sitting in markets and in Fed Farmers; Precision: daily on mainnet, weekly on L2s"
        headerProps={{
            direction: { base: 'column', md: 'row' },
            align: { base: 'flex-start', md: 'flex-end' },
        }}
        right={
            currentCirculatingSupply && <VStack spacing="0" alignItems="flex-end">
                <Text textAlign="right" fontSize={fontSize} fontWeight="extrabold">{shortenNumber(currentCirculatingSupply * price, 2, true)}</Text>
                <Text fontWeight="bold" textAlign="right" fontSize={fontSize2} color="accentTextColor">Current circulating supply</Text>
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