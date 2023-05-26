import { FormControl, HStack, Stack, Switch, useMediaQuery, Text, Divider } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useDBREmissions } from "@app/hooks/useFirm";
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "./DefaultCharts";
import { ONE_DAY_MS } from "@app/config/constants";
import { AreaChart } from "./AreaChart";
import { timestampToUTC } from "@app/util/misc";

const initEvent = { blocknumber: 16196827, timestamp: 1671148800000, txHash: '', amount: 4646000 };
const streamingStartTs = 1684713600000;

export const DbrEmissions = ({
    maxChartWidth = 800,
    yearlyRewardRate,
    rewardRate,
    replenishments,
    histoPrices,
}: {
    maxChartWidth: number
    yearlyRewardRate: number
    rewardRate: number
    replenishments: any[]
    histoPrices: { [key: string]: number }
}) => {
    const [includeInitialEmission, setIncludeInitialEmission] = useState(false);
    const [includeReplenishments, setIncludeReplenishments] = useState(true);
    const [includeClaims, setIncludeClaims] = useState(true);
    const [useUsd, setUseUsd] = useState(false);

    // const now = +(new Date());
    // const inOneYear = now + ONE_DAY_MS * 365;
    // const deltaSec = (now - streamingStartTs) / 1000
    // const amountSinceStart = rewardRate * deltaSec;

    // const theoreticalStreaming = [
    //     { amount: 0, timestamp: streamingStartTs },
    //     { amount: amountSinceStart, timestamp: now },
    //     { amount: yearlyRewardRate, timestamp: inOneYear },
    // ];
    // if(includeInitialEmission) {
    //     theoreticalStreaming.unshift(initEvent);
    // }

    const [isSmooth, setIsSmooth] = useState(true);
    const repHashes = replenishments?.map(r => r.txHash) || [];
    const { events: emissionEvents, rewardRatesHistory, timestamp } = useDBREmissions();

    const rateChanges = (rewardRatesHistory?.rates || [
        { yearlyRewardRate: 0, timestamp: streamingStartTs - ONE_DAY_MS * 3 },
        { yearlyRewardRate: 4000000, timestamp: streamingStartTs },
    ]).map(e => {
        const date = timestampToUTC(e.timestamp);
        const histoPrice = histoPrices[date];
        return { ...e, histoPrice, worth: e.yearlyRewardRate * (histoPrice || 0.05), date };
    });
    
    const intermediaryPoints = Object.entries(histoPrices)
        .filter(([date, v]) => date > rateChanges[0]?.date)
        .map(([date, histoPrice]) => {
            const yearlyRewardRate = rateChanges.findLast(d => date >= d.date)?.yearlyRewardRate || 0;
            return { yearlyRewardRate, date, timestamp: +(new Date(date)), histoPrice, worth: histoPrice * yearlyRewardRate };
        });
    const annualizedEmissions = rateChanges.concat(intermediaryPoints);    

    const filteredEvents = includeReplenishments && includeClaims ?
        emissionEvents :
        emissionEvents?.filter(e => {
            return includeReplenishments ? repHashes.includes(e.txHash) : !repHashes.includes(e.txHash);
        });

    const _events = (includeInitialEmission ? [initEvent, ...filteredEvents] : filteredEvents)
        .map(e => {
            const histoPrice = histoPrices[timestampToUTC(e.timestamp)] || 0.05;
            return { ...e, worth: e.amount * histoPrice };
        });

    const { chartData: emissionChartData } = useEventsAsChartData(_events, '_auto_', useUsd ? 'worth' : 'amount');
    // const { chartData: theoreticalStreamingChartData } = useEventsAsChartData(theoreticalStreaming, '_auto_', 'amount', false, false);
    const { chartData: annualizedEmissionsChartData } = useEventsAsChartData(annualizedEmissions, useUsd ? 'worth' : 'yearlyRewardRate', useUsd ? 'worth' : 'yearlyRewardRate', true, false);

    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <Stack w='full' direction={{ base: 'column' }}>
        <FormControl cursor="pointer" w='full' justifyContent="flex-start" display='flex' alignItems='center'>
            <Text mr="2" onClick={() => setUseUsd(!useUsd)}>
                In USD historical value
            </Text>
            <Switch onChange={(e) => setUseUsd(!useUsd)} size="sm" colorScheme="purple" isChecked={useUsd} />
        </FormControl>
        <AreaChart
            title="DBR annualized issuance over time"
            width={chartWidth}
            data={annualizedEmissionsChartData}
            interpolation="stepAfter"
            id="annualized-streaming"
            showMaxY={false}
            showTooltips={true}
            domainYpadding={1000000}
            isDollars={useUsd}
        />
        <Divider />
        <HStack pt="4" spacing="4" justify="space-between" alignItems="center" w='full'>
            <HStack spacing="4" justify="flex-start" alignItems="center">
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeInitialEmission(!includeInitialEmission)}>
                        Initial issuance
                    </Text>
                    <Switch onChange={(e) => setIncludeInitialEmission(!includeInitialEmission)} size="sm" colorScheme="purple" isChecked={includeInitialEmission} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeReplenishments(!includeReplenishments)}>
                        Forced replenishments
                    </Text>
                    <Switch onChange={(e) => setIncludeReplenishments(!includeReplenishments)} size="sm" colorScheme="purple" isChecked={includeReplenishments} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeClaims(!includeClaims)}>
                        Claimed by stakers
                    </Text>
                    <Switch onChange={(e) => setIncludeClaims(!includeClaims)} size="sm" colorScheme="purple" isChecked={includeClaims} />
                </FormControl>
            </HStack>
            <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                <Text mr="2" onClick={() => setIsSmooth(!isSmooth)}>
                    Smooth line?
                </Text>
                <Switch onChange={(e) => setIsSmooth(!isSmooth)} size="sm" colorScheme="blue" isChecked={isSmooth} />
            </FormControl>
        </HStack>
        <DefaultCharts
            chartData={emissionChartData}
            maxChartWidth={chartWidth}
            isDollars={useUsd}
            showMonthlyBarChart={true}
            areaProps={{
                interpolation: isSmooth ? "basis" : "stepAfter",
                title: "DBR issuance over time",
                domainYpadding: "auto",
            }}
            barProps={{
                eventName: 'Issuance',
                title: 'DBR issuance in the last 12 months'
            }}
        />
        {/* <AreaChart
            title="Theoretical Emissions Evolution"
            width={chartWidth}
            data={theoreticalStreamingChartData}
            interpolation="linear"
            id="theoretical-streaming"
            showMaxY={false}
        /> */}
    </Stack>
}