import { FormControl, Stack, useMediaQuery, Text, Switch } from "@chakra-ui/react";
import { AreaChart } from "./AreaChart"
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { DbrDebt } from "./DbrDebt";
import { useEventsAsChartData } from "@app/hooks/misc";
import { timestampToUTC } from "@app/util/misc";
import { VictoryAxis, VictoryLine } from "victory";
import { MultiChart } from "./MultiChart";
import { DbrMultiChart } from "./DbrMultiChart";
import { useDBREmissions } from "@app/hooks/useFirm";
import { ONE_DAY_MS } from "@app/config/constants";
import { DbrComboChart } from "./DbrComboChart";

const initEvent = { blocknumber: 16196827, timestamp: 1671148800000, txHash: '', amount: 4646000 };
const streamingStartTs = 1684713600000;

export const DbrAll = ({
    history,
    burnEvents,
    histoPrices,
    maxChartWidth = 800,
}) => {
    const [useUsd, setUseUsd] = useState(false);

    const { events: emissionEvents, rewardRatesHistory, timestamp } = useDBREmissions();

    const rateChanges = (rewardRatesHistory?.rates || [
        { yearlyRewardRate: 0, timestamp: streamingStartTs - ONE_DAY_MS * 3 },
        { yearlyRewardRate: 4000000, timestamp: streamingStartTs },
    ]).map(e => {
        const date = timestampToUTC(e.timestamp);
        const histoPrice = histoPrices[date];
        return { ...e, histoPrice, worth: e.yearlyRewardRate * (histoPrice || 0.05), date };
    });

    const annualizedEmissions = history
        .map((d) => {
            const date = timestampToUTC(d.timestamp);
            const histoPrice = (histoPrices[date] || 0.05);
            const yearlyRewardRate = rateChanges.findLast(d => date >= d.date)?.yearlyRewardRate || 0;
            return { yearlyRewardRate, date, timestamp: +(new Date(date)), histoPrice, worth: histoPrice * yearlyRewardRate };
        });

    const _history = history?.map(d => {
        const histoPrice = (histoPrices[timestampToUTC(d.timestamp)] || 0.05);
        return { ...d, debtUsd: d.debt * histoPrice, histoPrice }
    });
    const _burnEvents = burnEvents?.map(d => {
        const histoPrice = (histoPrices[timestampToUTC(d.timestamp)] || 0.05);
        return { ...d, accBurnUsd: d.accBurn * histoPrice, amountUsd: d.amount * histoPrice }
    });

    const combodata = history?.map(d => {
        const date = timestampToUTC(d.timestamp);
        const histoPrice = (histoPrices[date] || 0.05);
        const yearlyRewardRate = rateChanges.findLast(rd => date >= rd.date)?.yearlyRewardRate || 0;
        return {
            ...d,
            time: (new Date(date)),
            date,
            debtUsd: d.debt * histoPrice,
            histoPrice,
            yearlyRewardRate,
        }
    });
    console.log(combodata)
    console.log(histoPrices)

    const { chartData: priceChartData } = useEventsAsChartData(_history, 'histoPrice', 'histoPrice');
    const { chartData: debtChartData } = useEventsAsChartData(_history, useUsd ? 'debtUsd' : 'debt', useUsd ? 'debtUsd' : 'debt');
    const { chartData: burnChartData } = useEventsAsChartData(_burnEvents, useUsd ? 'accBurnUsd' : 'accBurn', useUsd ? 'amountUsd' : 'amount');
    const { chartData: annualizedEmissionsChartData } = useEventsAsChartData(annualizedEmissions, useUsd ? 'worth' : 'yearlyRewardRate', useUsd ? 'worth' : 'yearlyRewardRate', true, false);

    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const { themeStyles } = useAppTheme();
    const defaultColorScale = [themeStyles.colors.secondary];

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const multiData = [
        debtChartData,
        annualizedEmissionsChartData,
        priceChartData,
    ]

    return <Stack w='full' direction={{ base: 'column' }}>
        <FormControl cursor="pointer" w='full' justifyContent="flex-start" display='flex' alignItems='center'>
            <Text mr="2" onClick={() => setUseUsd(!useUsd)}>
                Show in USD historical value
            </Text>
            <Switch onChange={(e) => setUseUsd(!useUsd)} size="sm" colorScheme="purple" isChecked={useUsd} />
        </FormControl>
        <DbrComboChart combodata={combodata} chartWidth={chartWidth} />
        {/* <DbrMultiChart
            multiData={multiData}
            showTooltips={true}
            height={300}
            width={chartWidth}
            // extraCharts={extraCharts}
            allowZoom={true}
            domainYpadding={'auto'}
            mainColor="secondary"
            isDollars={useUsd}
            id="dbr-burns-evo-2"
            title="DBR burned over time"
        />
        <AreaChart
            showTooltips={true}
            height={300}
            width={chartWidth}
            data={priceChartData}
            domainYpadding={'auto'}
            mainColor="secondary"
            isDollars={true}
            id="dbr-price"
            title="DBR price"
            yTickPrecision={4}
            allowZoom={true}
        /> */}
        {/* 
        <DbrDebt chartData={debtChartData} useUsd={useUsd} />
        <AreaChart
            showTooltips={true}
            height={300}
            width={chartWidth}
            data={burnChartData}
            domainYpadding={'auto'}
            mainColor="secondary"
            isDollars={useUsd}
            id="dbr-burns-evo"
            title="DBR burned over time"
        />
        <BarChart12Months
            title="DBR burned in the last 12 months"
            chartData={burnChartData}
            maxChartWidth={chartWidth}
            eventName="Burn"
            yAttribute="yDay"
            colorScale={defaultColorScale}
            isDollars={useUsd}
        /> */}
    </Stack>
}