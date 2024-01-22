import { VStack, useMediaQuery } from "@chakra-ui/react"
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { useEffect, useState } from "react";

const maxChartWidth = 1200;

export const DsaStakingChart = ({ events }) => {
    const { chartData } = useEventsAsChartData(events, 'totalDolaStaked', 'totalDolaStaked', true, true, 0);    
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <VStack pt="8">
        <DefaultCharts
            showMonthlyBarChart={false}
            maxChartWidth={autoChartWidth}
            chartWidth={autoChartWidth}
            chartData={chartData}
            isDollars={false}
            smoothLineByDefault={false}                        
            areaProps={{ title: 'DOLA staked in DSA over time', id: 'dola-staking-dsa', showRangeBtns: true, yLabel: 'DOLA staked', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
        />
    </VStack>
}

export const SDolaStakingChart = ({ events }) => {
    const { chartData } = useEventsAsChartData(events, 'sDolaStaking', 'sDolaStaking', true, true, 0);    
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <VStack pt="8">
        <DefaultCharts
            showMonthlyBarChart={false}
            maxChartWidth={autoChartWidth}
            chartWidth={autoChartWidth}
            chartData={chartData}
            isDollars={false}
            smoothLineByDefault={false}
            areaProps={{ title: 'DOLA staked in sDOLA over time', id: 'dola-staking-sdola', showRangeBtns: true, yLabel: 'DOLA staked', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
        />
    </VStack>
}