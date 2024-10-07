import { Stack, VStack, useMediaQuery, Text, Checkbox, HStack } from "@chakra-ui/react"
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "@app/components/Transparency/DefaultCharts";
import { useEffect, useState } from "react";
import { PieChartRecharts } from "@app/components/Transparency/PieChartRecharts";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { getPreviousThursdayUtcDateOfTimestamp } from "@app/util/misc";
import { BarChartRecharts } from "@app/components/Transparency/BarChartRecharts";

const maxChartWidth = 1200;

// make the chart look better, => buys appear as spikes
const surroundByZero = (chartDataAcc: { x: number, y: number }[]) => {
    const cloned = [...chartDataAcc];
    for (let i = 0; i < cloned.length; i++) {
        if (cloned[i].yDay > 0 && i > 0) {
            cloned.splice(i + 1, 0, { ...cloned[i], x: cloned[i].x + 1000 * 60, yDay: 0 });
        }
    }
    return cloned;
}

export const DbrAuctionBuysChart = ({ events, chartEvents, isTotal = false, useInvAmount = false }) => {
    const [useUsd, setUseUsd] = useState(false);
    const { chartData: chartDataAcc } = useEventsAsChartData(chartEvents, '_acc_', isTotal || useUsd ? 'worthIn' : useInvAmount ? 'invIn' : 'dolaIn', true, true);
    const { chartData: chartDataAccUsd } = useEventsAsChartData(chartEvents, '_acc_', 'worthIn', true, true);
    const { chartData: chartDataArb } = useEventsAsChartData(chartEvents.filter(e => e.arb > 0), 'arbPerc', 'arbPerc', true, true);
    const virtualAuctionBuysEvents = events.filter(e => e.auctionType === 'Virtual');
    const sdolaAuctionBuysEvents = events.filter(e => e.auctionType === 'sDOLA');
    const invAuctionBuysEvents = events.filter(e => e.auctionType === 'sINV');

    const { themeStyles } = useAppTheme();
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const [isLargerThan2xl] = useMediaQuery(`(min-width: 96em)`);

    const generalAuctionBuys = virtualAuctionBuysEvents
        .reduce((prev, curr) => prev + curr.dolaIn, 0);

    const sDolaAuctionBuys = sdolaAuctionBuysEvents
        .reduce((prev, curr) => prev + curr.dolaIn, 0);

    const invAuctionBuys = invAuctionBuysEvents
        .reduce((prev, curr) => prev + (useInvAmount ? (curr.invIn || 0) : curr.worthIn), 0);

    const uniqueWeeks = [...new Set(chartEvents.map(e => getPreviousThursdayUtcDateOfTimestamp(e.timestamp)))];
    uniqueWeeks.sort((a, b) => a > b ? 1 : -1);
    const dbrPricesStats = uniqueWeeks.map(week => {
        const weekEvents = chartEvents.filter(e => getPreviousThursdayUtcDateOfTimestamp(e.timestamp) === week);
        const prices = weekEvents.map(e => useInvAmount ? e.priceInInv : e.priceInDola);
        const marketPrices = weekEvents.map(e => useInvAmount ? e.marketPriceInInv : e.marketPriceInDola);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const nbWeekEvents = weekEvents.length;
        const avg = prices.reduce((prev, curr) => prev + curr, 0) / nbWeekEvents;
        const avgMarketPrice = marketPrices.reduce((prev, curr) => prev + curr, 0) / nbWeekEvents;
        return { week, avg, avgMarketPrice, min, max, y: avg, y2: avgMarketPrice, x: week }
    });

    const dbrWeeklyIncomeStats = uniqueWeeks.map(week => {
        const weekEvents = chartEvents.filter(e => getPreviousThursdayUtcDateOfTimestamp(e.timestamp) === week);
        const dolaIn = weekEvents.map(e => e.dolaIn ? e.dolaIn : useInvAmount ? (e.invIn || 0) : e.worthIn);
        const total = dolaIn.reduce((prev, curr) => prev + curr, 0);
        return { week, y: total, x: week }
    });

    const nbWeeksToShow = isLargerThan ? 8 : 6;
    const last8WeeksDbrPricesStats = dbrPricesStats.slice(dbrPricesStats.length - nbWeeksToShow, dbrPricesStats.length);
    const last8WeeksIncomeStats = dbrWeeklyIncomeStats.slice(dbrWeeklyIncomeStats.length - nbWeeksToShow, dbrWeeklyIncomeStats.length);

    const pieChartData = [
        { name: 'Virtual', value: generalAuctionBuys },
        { name: 'sDOLA', value: sDolaAuctionBuys },
        { name: 'sINV', value: invAuctionBuys },
    ];

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 80)
    }, [isLargerThan]);

    return <VStack alignItems="flex-start">
        <Stack position="relative" pt="10" direction={{ base: 'column', '2xl': 'row' }} alignItems="center">
            {
                useInvAmount && <HStack zIndex="2" position="absolute" top="10" right="20">
                    <Checkbox cursor="pointer" id="use-usd" onChange={() => setUseUsd(!useUsd)} isChecked={useUsd} />
                    <Text cursor="pointer" as="label" htmlFor="use-usd">Show in USD</Text>
                </HStack>
            }

            {/* bugs if conditional swap instead of show/shide */}
            <VStack spacing="0">
                <VStack display={useUsd ? 'block' : 'none'}>
                    <DefaultCharts
                        showMonthlyBarChart={false}
                        maxChartWidth={autoChartWidth}
                        chartWidth={autoChartWidth}
                        chartData={surroundByZero(chartDataAccUsd)}
                        isDollars={true}
                        smoothLineByDefault={false}
                        areaProps={{ secondaryRef: 'yDay', secondaryAsLeftAxis: true, secondaryAsUsd: true, secondaryPrecision: 2, secondaryLabel: useInvAmount ? 'INV income' : 'DOLA income', secondaryType: 'stepAfter', showSecondary: true, title: 'Income from all DBR auction buys', defaultRange: '1M', fillInByDayInterval: true, id: `dbr-auction-buys-chart-usd`, showRangeBtns: true, yLabel: `Acc. ${useInvAmount ? 'INV' : 'DOLA'} income`, useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'secondary', allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '1W', 'YTD'] }}
                    />
                </VStack>
                <VStack display={useUsd ? 'none' : 'block'}>
                    <DefaultCharts
                        showMonthlyBarChart={false}
                        maxChartWidth={autoChartWidth}
                        chartWidth={autoChartWidth}
                        chartData={surroundByZero(chartDataAcc)}
                        isDollars={false}
                        smoothLineByDefault={false}
                        areaProps={{ secondaryRef: 'yDay', secondaryAsLeftAxis: true, secondaryAsUsd: false, secondaryPrecision: 2, secondaryLabel: useInvAmount ? 'INV income' : 'DOLA income', secondaryType: 'stepAfter', showSecondary: true, title: 'Income from all DBR auction buys', defaultRange: '1M', fillInByDayInterval: true, id: `dbr-auction-buys-chart`, showRangeBtns: true, yLabel: `Acc. ${useInvAmount ? 'INV' : 'DOLA'} income`, useRecharts: true, showMaxY: false, domainYpadding: 1000, showTooltips: true, autoMinY: true, mainColor: 'secondary', allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '1W', 'YTD'] }}
                    />
                </VStack>
            </VStack>

        </Stack>
        <BarChartRecharts
            title={`Weekly average prices in the last ${nbWeeksToShow} weeks`}
            combodata={last8WeeksDbrPricesStats}
            precision={4}
            yAxisPrecision={4}
            yDomain={useInvAmount ? [0.001, 0.004] : [0.05, 0.25]}
            chartWidth={autoChartWidth - 50}
            yLabel="Avg. Auction Price"
            yLabel2="Avg. Market Price"
            useUsd={false}
            showLabel={isLargerThan}
            isDoubleBar={true}
        />
        <BarChartRecharts
            title={`Weekly ${useInvAmount ? 'INV' : 'DOLA'} income in the last ${nbWeeksToShow} weeks`}
            combodata={last8WeeksIncomeStats}
            precision={2}
            // yDomain={[0.05, 0.25]}
            chartWidth={autoChartWidth - 50}
            yLabel="Weekly income"
            useUsd={false}
            showLabel={isLargerThan}
        />
        <VStack pt="10">
            <DefaultCharts
                showMonthlyBarChart={false}
                maxChartWidth={autoChartWidth}
                chartWidth={autoChartWidth}
                chartData={chartDataArb}
                isDollars={false}
                smoothLineByDefault={false}
                areaProps={{
                    lineItems: [
                        { dataKey: useInvAmount ? 'priceInInv' : 'priceInDola', name: 'Auction price', axisId: 'right', stroke: themeStyles.colors.info },
                        { dataKey: useInvAmount ? 'marketPriceInInv' : 'marketPriceInDola', name: 'Market price', axisId: 'right', stroke: themeStyles.colors.success },
                    ],
                    showSecondary: true,
                    secondaryRef: '',
                    interpolation: 'step',
                    showLegend: true,
                    title: 'Prices at auction buys and price diff %', fillInByDayInterval: true, id: 'dbr-auction-buys-acc', showRangeBtns: true, yLabel: 'Difference', useRecharts: true, showMaxY: false, isPerc: true, showTooltips: true, autoMinY: true, mainColor: 'gold', strokeColor: 'orange', allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '1W', 'YTD']
                }}
            />
        </VStack>
        <Stack w='full' direction={{ base: 'column', '2xl': 'row' }} alignItems="center">
            {
                isTotal && <VStack pt='10' w='full' alignItems="center">
                    <Text fontWeight="bold">Total buys repartition</Text>
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
            }
        </Stack>
    </VStack>
}