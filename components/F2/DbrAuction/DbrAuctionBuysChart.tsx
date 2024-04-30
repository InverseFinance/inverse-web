import { Stack, VStack, useMediaQuery, Text } from "@chakra-ui/react"
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { useEffect, useState } from "react";
import { PieChartRecharts } from "@app/components/Transparency/PieChartRecharts";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { getPreviousThursdayUtcDateOfTimestamp } from "@app/util/misc";
import { BarChartRecharts } from "@app/components/Transparency/BarChartRecharts";

const maxChartWidth = 1200;

export const DbrAuctionBuysChart = ({ events }) => {
    const { chartData: chartDataAcc } = useEventsAsChartData(events, '_acc_', 'dolaIn', true, true);
    const { themeStyles } = useAppTheme();
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const [isLargerThan2xl] = useMediaQuery(`(min-width: 96em)`);

    const generalAuctionBuys = events.filter(e => e.auctionType === 'Virtual')
        .reduce((prev, curr) => prev + curr.dolaIn, 0);

    const sDolaAuctionBuys = events.filter(e => e.auctionType === 'sDOLA')
        .reduce((prev, curr) => prev + curr.dolaIn, 0);

    const uniqueWeeks = [...new Set(events.map(e => getPreviousThursdayUtcDateOfTimestamp(e.timestamp)))];

    const dbrPricesStats = uniqueWeeks.map(week => {
        const weekEvents = events.filter(e => getPreviousThursdayUtcDateOfTimestamp(e.timestamp) === week);
        const prices = weekEvents.map(e => e.priceInDola);
        const marketPrices = weekEvents.map(e => e.marketPriceInDola);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const nbWeekEvents = weekEvents.length;
        const avg = prices.reduce((prev, curr) => prev + curr, 0) / nbWeekEvents;
        const avgMarketPrice = marketPrices.reduce((prev, curr) => prev + curr, 0) / nbWeekEvents;
        return { week, avg, avgMarketPrice, min, max, y: avg, y2: avgMarketPrice, x: week }
    });
    const nbWeeksToShow = isLargerThan ? 8 : 6;
    const last8WeeksDbrPricesStats = dbrPricesStats.slice(dbrPricesStats.length - nbWeeksToShow, dbrPricesStats.length);

    const pieChartData = [
        { name: 'Virtual', value: generalAuctionBuys },
        { name: 'sDOLA', value: sDolaAuctionBuys },
    ];

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <VStack alignItems="flex-start">
        <Stack direction={{ base: 'column', '2xl': 'row' }} alignItems="center">
            <VStack pt="10">
                <DefaultCharts
                    showMonthlyBarChart={false}
                    maxChartWidth={isLargerThan2xl ? autoChartWidth / 2 : autoChartWidth}
                    chartWidth={isLargerThan2xl ? autoChartWidth / 2 : autoChartWidth}
                    chartData={chartDataAcc}
                    isDollars={false}
                    smoothLineByDefault={false}
                    barProps={{ eventName: 'DBR auction buys' }}
                    areaProps={{ title: 'Acc. income from DBR auction buys', fillInByDayInterval: true, id: 'dbr-auction-buys-acc', showRangeBtns: true, yLabel: 'DOLA Income', useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'info', allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '1W', 'YTD'] }}
                />
            </VStack>
            <VStack pt='10'>
                <Text fontWeight="bold">Buys repartition</Text>
                <PieChartRecharts
                    precision={0}
                    width={isLargerThan2xl ? autoChartWidth / 2 : autoChartWidth}
                    height={300}
                    data={pieChartData}
                    dataKey={'value'}
                    nameKey={'name'}
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    activeFill={themeStyles.colors.mainTextColor}
                    fill={themeStyles.colors.mainTextColorLight}
                />
            </VStack>
        </Stack>
        <BarChartRecharts
            title={`Weekly average prices in the last ${nbWeeksToShow} weeks`}
            combodata={last8WeeksDbrPricesStats}
            precision={4}
            yDomain={[0.05, 0.25]}
            chartWidth={autoChartWidth * 0.9}
            yLabel="Avg. Auction Price"
            yLabel2="Avg. Market Price"
            useUsd={false}
            showLabel={isLargerThan}
            isDoubleBar={true}
        />
    </VStack>
}