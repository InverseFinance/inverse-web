import { FormControl, HStack, Stack, Switch, useMediaQuery, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useDBREmissions } from "@app/hooks/useFirm";
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "./DefaultCharts";
import { timestampToUTC } from "@app/util/misc";

const initEvent = { blocknumber: 16196827, timestamp: 1671148800000, txHash: '', amount: 4646000 };

export const DbrEmissions = ({
    maxChartWidth = 800,
    replenishments,
    histoPrices,
    useUsd = false,
}: {
    maxChartWidth: number
    replenishments: any[]
    histoPrices: { [key: string]: number }
    useUsd?: boolean
}) => {
    const [includeInitialEmission, setIncludeInitialEmission] = useState(false);
    const [includeReplenishments, setIncludeReplenishments] = useState(true);
    const [includeClaims, setIncludeClaims] = useState(true);

    const repHashes = replenishments?.map(r => r.txHash) || [];
    const { events: emissionEvents, rewardRatesHistory, timestamp } = useDBREmissions();

    const filteredEvents = includeReplenishments && includeClaims ?
        emissionEvents :
        emissionEvents?.filter(e => {
            return includeReplenishments ? repHashes.includes(e.txHash) : !repHashes.includes(e.txHash);
        });

    const _events = (includeInitialEmission ? [initEvent, ...filteredEvents] : filteredEvents)?.map(e => {
            const histoPrice = histoPrices[timestampToUTC(e.timestamp)] || 0.05;
            return { ...e, worth: e.amount * histoPrice };
        });

    const { chartData: emissionChartData } = useEventsAsChartData(_events, '_auto_', useUsd ? 'worth' : 'amount');

    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <Stack w='full' direction={{ base: 'column' }}>       
        <Stack direction={{ base :'column', sm: 'row' }} pt="4" spacing="4" justify="space-between" alignItems="center" w='full'>
            <HStack spacing="4" justify="flex-start" alignItems="center">
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeInitialEmission(!includeInitialEmission)}>
                        Initial issuance
                    </Text>
                    <Switch onChange={(e) => setIncludeInitialEmission(!includeInitialEmission)} size="sm" colorScheme="purple" isChecked={includeInitialEmission} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeReplenishments(!includeReplenishments)}>
                        Replenishments
                    </Text>
                    <Switch onChange={(e) => setIncludeReplenishments(!includeReplenishments)} size="sm" colorScheme="purple" isChecked={includeReplenishments} />
                </FormControl>
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeClaims(!includeClaims)}>
                        Claims
                    </Text>
                    <Switch onChange={(e) => setIncludeClaims(!includeClaims)} size="sm" colorScheme="purple" isChecked={includeClaims} />
                </FormControl>
            </HStack>
        </Stack>
        <DefaultCharts
            chartData={emissionChartData}
            maxChartWidth={chartWidth}
            isDollars={useUsd}
            showMonthlyBarChart={true}
            showAreaChart={false}
            barProps={{
                eventName: 'Issuance',
                title: 'DBR issuance in the last 12 months'
            }}
        />
    </Stack>
}