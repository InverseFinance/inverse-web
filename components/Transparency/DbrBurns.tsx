import { FormControl, Stack, useMediaQuery, Text, Switch } from "@chakra-ui/react";
import { AreaChart } from "./AreaChart"
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { DbrDebt } from "./DbrDebt";
import { useEventsAsChartData } from "@app/hooks/misc";
import { timestampToUTC } from "@app/util/misc";

export const DbrBurns = ({
    history,
    burnEvents,
    histoPrices,
    maxChartWidth = 800,
}) => {
    const [useUsd, setUseUsd] = useState(false);
    const _history = history?.map(d => {
        return { ...d, debtUsd: d.debt * (histoPrices[timestampToUTC(d.timestamp)]||0.05) }
    });
    const _burnEvents = burnEvents?.map(d => {
        const histoPrice = (histoPrices[timestampToUTC(d.timestamp)]||0.05);
        return { ...d, accBurnUsd: d.accBurn * histoPrice, amountUsd: d.amount * histoPrice }
    });
    const { chartData: debtChartData } = useEventsAsChartData(_history, useUsd ? 'debtUsd' : 'debt', useUsd ? 'debtUsd' : 'debt');
    const { chartData: burnChartData } = useEventsAsChartData(_burnEvents, useUsd ? 'accBurnUsd' : 'accBurnUsd', useUsd ? 'amountUsd' : 'amount');
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
        />
    </Stack>
}