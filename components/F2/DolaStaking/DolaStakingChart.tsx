import { VStack, useMediaQuery } from "@chakra-ui/react"
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { useEffect, useState } from "react";

const maxChartWidth = 1200;

export const DsaStakingChart = ({ events }) => {
    const { chartData } = useEventsAsChartData(events, 'totalDolaStaked', 'totalDolaStaked', true, true);    
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
    const { chartData } = useEventsAsChartData(events, 'sDolaStaking', 'sDolaStaking', true, true);    
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
            areaProps={{ title: 'sDOLA supply evolution', id: 'sdola-supply-evo-chart', showRangeBtns: true, yLabel: 'DOLA staked', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '2W', 'YTD'], }}
        />
    </VStack>
}

export const SDolaStakingEvolutionChart = ({ evolution, attribute, yLabel, title, isPerc = false }) => {
    const { chartData } = useEventsAsChartData(evolution, attribute, attribute, true, true);    
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
            areaProps={{ title, isPerc, id: 'dola-staking-evolution', showRangeBtns: true, yLabel, useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '2W', 'YTD'], }}
        />
    </VStack>
}