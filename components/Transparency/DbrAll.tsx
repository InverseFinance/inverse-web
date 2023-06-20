import { FormControl, Stack, useMediaQuery, Text, Switch, Divider } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useEventsAsChartData } from "@app/hooks/misc";
import { timestampToUTC } from "@app/util/misc";
import { useDBREmissions } from "@app/hooks/useFirm";
import { ONE_DAY_MS } from "@app/config/constants";
import { DbrComboChart } from "./DbrComboChart";
import { DbrEmissions } from "./DbrEmissions";
import { useDBRPrice } from "@app/hooks/useDBR";

const streamingStartTs = 1684713600000;

export const DbrAll = ({
    history,
    burnEvents,
    histoPrices,
    replenishments,
    maxChartWidth = 800,
    yearlyRewardRate,
}) => {
    const [useUsd, setUseUsd] = useState(false);
    const { price: dbrPrice } = useDBRPrice();

    const { events: emissionEvents, rewardRatesHistory, timestamp } = useDBREmissions();

    const rateChanges = (rewardRatesHistory?.rates || [
        { yearlyRewardRate: 0, timestamp: streamingStartTs - ONE_DAY_MS * 3 },
        { yearlyRewardRate: 4000000, timestamp: streamingStartTs },
    ]).map(e => {
        const date = timestampToUTC(e.timestamp);
        const histoPrice = histoPrices[date];
        return { ...e, histoPrice, worth: e.yearlyRewardRate * (histoPrice || 0.05), date };
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
            debt: d.debt,
            debtUsd: d.debt * histoPrice,
            histoPrice,
            yearlyRewardRate,
            yearlyRewardRateUsd: yearlyRewardRate * histoPrice,
        }
    });

    // today utc: use current price
    if(combodata?.length > 0 && !!dbrPrice && !!yearlyRewardRate) {        
        const now = Date.now();
        const todayUTC = timestampToUTC(now);
        const todayIndex = combodata.findIndex(d => d.date === todayUTC);
        const last = combodata[combodata.length - 1];
        combodata.splice(todayIndex, combodata.length -(todayIndex), {
            ...last,
            timestamp: now,
            time: new Date(timestampToUTC(now)),
            debtUsd: last.debt * dbrPrice,
            histoPrice: dbrPrice,
            date: timestampToUTC(now),
            yearlyRewardRate: yearlyRewardRate,
            yearlyRewardRateUsd: yearlyRewardRate * dbrPrice,
        });
    }

    const { chartData: burnChartData } = useEventsAsChartData(_burnEvents, useUsd ? 'accBurnUsd' : 'accBurn', useUsd ? 'amountUsd' : 'amount');

    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const { themeStyles } = useAppTheme();
    const defaultColorScale = [themeStyles.colors.secondary];

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <Stack w='full' direction={{ base: 'column' }}>
        <FormControl cursor="pointer" w='full' justifyContent="flex-start" display='flex' alignItems='center'>
            <Text mr="2" onClick={() => setUseUsd(!useUsd)}>
                Show in USD historical value
            </Text>
            <Switch onChange={(e) => setUseUsd(!useUsd)} size="sm" colorScheme="purple" isChecked={useUsd} />
        </FormControl>
        <Divider />
        <DbrComboChart combodata={combodata} chartWidth={chartWidth} useUsd={useUsd} />
        <Divider />        
        <BarChart12Months
            title="DBR burned in the last 12 months"
            chartData={burnChartData}
            maxChartWidth={chartWidth}
            eventName="Burn"
            yAttribute="yDay"
            colorScale={defaultColorScale}
            isDollars={useUsd}
        />
        <DbrEmissions
            maxChartWidth={chartWidth}
            histoPrices={histoPrices}
            replenishments={replenishments}
            useUsd={useUsd}
        />
    </Stack>
}