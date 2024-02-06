import { Stack, VStack, useMediaQuery } from "@chakra-ui/react"
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { useEffect, useState } from "react";
import { PieChartRecharts } from "@app/components/Transparency/PieChartRecharts";

const maxChartWidth = 1200;

export const DbrAuctionBuysChart = ({ events }) => {    
    const { chartData: chartDataAcc } = useEventsAsChartData(events, '_acc_', 'dolaIn', true, true);
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    const generalAuctionBuys = events.filter(e => e.auctionType === 'Virtual')
        .reduce((prev, curr) => prev + curr.dolaIn, 0);

    const sDolaAuctionBuys = events.filter(e => e.auctionType === 'sDOLA')
        .reduce((prev, curr) => prev + curr.dolaIn, 0);

    const pieChartData = [
        { name: 'Virtual', value: generalAuctionBuys },
        { name: 'sDOLA', value: sDolaAuctionBuys },
    ];

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <Stack>        
        <VStack pt="10">
            <DefaultCharts
                showMonthlyBarChart={false}
                maxChartWidth={autoChartWidth}
                chartWidth={autoChartWidth}
                chartData={chartDataAcc}
                isDollars={false}
                smoothLineByDefault={false}
                barProps={{ eventName: 'DBR auction buys' }}
                areaProps={{ title: 'Cumulated income from DBR auction buys', fillInByDayInterval: true, id: 'dbr-auction-buys-acc', showRangeBtns: true, yLabel: 'DOLA Income', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '1W', 'YTD'] }}
            />
        </VStack>
        <PieChartRecharts
            precision={0}
            width={autoChartWidth}
            height={300}
            data={pieChartData}
            dataKey={'value'}
            nameKey={'name'}
            cx="50%"
            cy="50%"
            outerRadius={50}       
        />
    </Stack>
}