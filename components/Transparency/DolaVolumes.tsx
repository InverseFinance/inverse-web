import { useDolaVolumes } from "@app/hooks/useDOLA"
import { VStack, useMediaQuery } from "@chakra-ui/react";
import { DefaultCharts } from "./DefaultCharts";
import { SkeletonBlob } from "../common/Skeleton";
import Container from "../common/Container";
import { useEffect, useState } from "react";
import { useAppTheme } from "@app/hooks/useAppTheme";

const maxChartWidth= 1300

export const DolaVolumes = () => {
    const { themeStyles } = useAppTheme();
    const { evolution, isLoading, isError } = useDolaVolumes();
    
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <Container noPadding m="0" p="0" label="DOLA 24h volumes" description="Source: coingecko">
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
                        areaProps={{ id: 'dola-volumes-chart', duplicateYAxis: true, addDayAvg: true, allowEscapeViewBox: false, avgTypes: ['moving-avg'], avgDayNumbers: [30], avgLineProps: [{ stroke: themeStyles.colors.success, strokeDasharray: '4 4' }], showRangeBtns: true, yLabel: 'DOLA 24h volume', useRecharts: true, simplifyData: true, domainYpadding: 1000000, showMaxY: false, showTooltips: true, autoMinY: false, mainColor: 'info', allowZoom: true, rangesToInclude: ['All', '1Y', '3M', '1M', '7D'], defaultRange: '1M' }}
                    />
            }
        </VStack>
    </Container>
}