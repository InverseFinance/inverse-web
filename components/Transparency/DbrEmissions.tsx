import { FormControl, Stack, Switch, Text, useMediaQuery } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "./DefaultCharts";
import { timestampToUTC } from "@app/util/misc";

export const DbrEmissions = ({
    maxChartWidth = 800,
    chartWidth,
    histoPrices,
    useUsd = false,
    emissionEvents,
}: {
    maxChartWidth: number
    chartWidth: number
    histoPrices: { [key: string]: number }
    useUsd?: boolean
    emissionEvents: any[]
}) => {
    const [includeTreasuryTransfers, setIncludeTreasuryTransfers] = useState(false);
    const [includeTreasuryMints, setIncludeTreasuryMints] = useState(false);
    const [includeReplenishments, setIncludeReplenishments] = useState(true);
    const [includeAuctionMints, setIncludeAuctionMints] = useState(true);
    const [includeClaims, setIncludeClaims] = useState(true);
    const [includeDsaClaims, setIncludeDsaClaims] = useState(true);

    const filteredEvents = useMemo(() => {
        return includeReplenishments && includeClaims && includeTreasuryMints && includeAuctionMints && includeDsaClaims ?
        emissionEvents :
        emissionEvents?.map(e => {
            let amount = 0;
            if (includeReplenishments) {
                amount += e.forcedReps;
            }
            if (includeClaims) {
                amount += e.stakingClaims;
            }
            if (includeTreasuryMints) {
                amount += e.treasuryMints;
            }
            if (includeAuctionMints) {
                amount += e.buys;
            }
            if (includeDsaClaims) {
                amount += e.dsaClaims;
            }
            if (includeTreasuryTransfers) {
                amount += e.treasuryTransfers;
            }
            return {
                ...e,
                amount,
            }
        });
    }, [emissionEvents, includeReplenishments, includeClaims, includeTreasuryMints, includeAuctionMints, includeDsaClaims]);

    const _events = filteredEvents?.map(e => {
        const histoPrice = histoPrices[e.utcDate] || 0.05;
        return { ...e, worth: e.amount * histoPrice };
    });

    const { chartData: emissionChartData } = useEventsAsChartData(_events, '_auto_', useUsd ? 'worth' : 'amount');

    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    const _chartWidth = chartWidth || autoChartWidth;

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <Stack w='full' direction={{ base: 'column' }} alignItems="flex-start">
        <Stack direction={{ base: 'column', sm: 'row' }} py="4" spacing="4" justify="space-between" alignItems="center" w='full'>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing="4" justify="flex-start" alignItems="flex-start">
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeTreasuryTransfers(!includeTreasuryTransfers)}>
                        Treasury Transfers
                    </Text>
                    <Switch onChange={(e) => setIncludeTreasuryTransfers(!includeTreasuryTransfers)} size="sm" colorScheme="purple" isChecked={includeTreasuryTransfers} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeReplenishments(!includeReplenishments)}>
                        Replenishments
                    </Text>
                    <Switch onChange={(e) => setIncludeReplenishments(!includeReplenishments)} size="sm" colorScheme="purple" isChecked={includeReplenishments} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeAuctionMints(!includeAuctionMints)}>
                        Virtual Auction
                    </Text>
                    <Switch onChange={(e) => setIncludeAuctionMints(!includeAuctionMints)} size="sm" colorScheme="purple" isChecked={includeAuctionMints} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeDsaClaims(!includeDsaClaims)}>
                        DSA Claims
                    </Text>
                    <Switch onChange={(e) => setIncludeDsaClaims(!includeDsaClaims)} size="sm" colorScheme="purple" isChecked={includeDsaClaims} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeClaims(!includeClaims)}>
                        Claims
                    </Text>
                    <Switch onChange={(e) => setIncludeClaims(!includeClaims)} size="sm" colorScheme="purple" isChecked={includeClaims} />
                </FormControl>
            </Stack>
        </Stack>
        <DefaultCharts
            chartData={emissionChartData}
            maxChartWidth={chartWidth}
            chartWidth={_chartWidth}
            isDollars={useUsd}
            showMonthlyBarChart={true}
            showAreaChart={false}
            barProps={{
                useRecharts: true,
                eventName: 'Issuance',
                title: 'DBR circ. supply increases in the last 12 months'
            }}
            containerProps={{ alignItems: 'flex-start' }}
        />
    </Stack>
}