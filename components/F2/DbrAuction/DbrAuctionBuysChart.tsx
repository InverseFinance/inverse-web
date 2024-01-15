import { VStack, useMediaQuery } from "@chakra-ui/react"
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { useEffect, useState } from "react";

const maxChartWidth = 1200;

export const DbrAuctionBuysChart = ({ events }) => {
    const { chartData } = useEventsAsChartData(events, 'dolaIn', 'dolaIn', true, true, 0);
    const { chartData: chartDataAcc } = useEventsAsChartData(events, '_acc_', 'dolaIn', true, true);
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <VStack>
        {/* <DefaultCharts
            showMonthlyBarChart={false}
            maxChartWidth={autoChartWidth}
            chartWidth={autoChartWidth}
            chartData={chartData}
            isDollars={false}
            smoothLineByDefault={false}
            barProps={{ eventName: 'DBR auction buys' }}
            areaProps={{ title: 'DBR auction buys', fillInByDayInterval: true, id: 'dbr-auction-buys', showRangeBtns: false, yLabel: 'Buy', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
        /> */}
        <DefaultCharts
            showMonthlyBarChart={false}
            maxChartWidth={autoChartWidth}
            chartWidth={autoChartWidth}
            chartData={chartDataAcc}
            isDollars={false}
            smoothLineByDefault={false}            
            barProps={{ eventName: 'DBR auction buys' }}
            areaProps={{ title: 'Cumulated income from DBR auction buys', fillInByDayInterval: true, id: 'dbr-auction-buys-acc', showRangeBtns: false, yLabel: 'DOLA Income', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true }}
        />
    </VStack>
}