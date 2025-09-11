import { DefaultCharts } from "@app/components/Transparency/DefaultCharts"
import { useDBR } from "@app/hooks/useDBR";
import { CoordinatesArray } from "@app/types";
import { getClosestPreviousHistoValue, timestampToUTC, utcDateStringToTimestamp } from "@app/util/misc";
import { FormControl, VStack, Text, Switch } from "@chakra-ui/react"
import { useState } from "react";

const getUsdChartData = (chartData: CoordinatesArray, histoPrices: Record<string, number>, dbrPriceUsd: number) => {
    const startDate = chartData[1]?.utcDate;
    const keys = Object.keys(histoPrices).filter(d => d >= startDate);
    let rateObj = null;
    const todayUtc = timestampToUTC(Date.now());
    return keys.map(utcDate => {
        const histoPrice = todayUtc === utcDate ? dbrPriceUsd : histoPrices[utcDate] || getClosestPreviousHistoValue(histoPrices, utcDate, 0);
        const timestamp = utcDateStringToTimestamp(utcDate);
        if (chartData.find(d => d.utcDate === utcDate)) {
            rateObj = chartData.find(d => d.utcDate === utcDate);
        }
        return {
            utcDate,
            timestamp,
            x: timestamp,
            year: new Date(utcDate).getFullYear(),
            month: new Date(utcDate).getMonth(),
            rate: rateObj?.rate,
            histoPrice,
            y: (rateObj?.rate || 0) * histoPrice,
            yDay: (rateObj?.yDay || 0) * histoPrice,
        }
    });
}

export const DbrYearlyBudgetEvolution = ({
    autoChartWidth,
    budgetChartData,
}: {
    autoChartWidth: number,
    budgetChartData: CoordinatesArray,
}) => {
    const [useUsd, setUseUsd] = useState(false);
    const { historicalData, priceUsd: dbrPriceUsd } = useDBR();
    const histoPrices = historicalData && !!historicalData?.prices ? historicalData.prices.reduce((prev, curr) => ({ ...prev, [timestampToUTC(curr[0])]: curr[1] }), {}) : {};

    const _chartData = useUsd ? getUsdChartData(budgetChartData, histoPrices, dbrPriceUsd) : budgetChartData;

    return <VStack pt="10">
        <FormControl w='full' justifyContent={{ base: 'center', sm: 'flex-start' }} display='flex' alignItems='center'>
            <Text cursor="pointer" fontSize='14px' mr="2" onClick={() => setUseUsd(!useUsd)}>
                Show in USD historical value
            </Text>
            <Switch onChange={(e) => setUseUsd(!useUsd)} size="sm" colorScheme="purple" isChecked={useUsd} />
        </FormControl>
        <DefaultCharts
            showMonthlyBarChart={false}
            showAreaChart={true}
            maxChartWidth={autoChartWidth - 50}
            chartWidth={autoChartWidth - 50}
            chartData={_chartData}
            isDollars={false}
            smoothLineByDefault={false}
            areaProps={{
                showSecondary: true,
                secondaryRef: 'histoPrice',
                secondaryLabel: 'Historical DBR price',
                interpolation: 'step',
                showLegend: false,
                allowEscapeViewBox: false,
                title: 'DBR yearly budget evolution', fillInByDayInterval: true, id: 'dbr-budget-evolution', showRangeBtns: true, yLabel: 'Yearly DBR budget', useRecharts: true, showMaxY: false, showTooltips: true, autoMinY: true, allowZoom: true, rangesToInclude: ['All', '6M', '3M', '1M', '1W', 'YTD']
            }}
        />
    </VStack>
}