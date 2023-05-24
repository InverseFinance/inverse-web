import { FormControl, HStack, Stack, Switch, useMediaQuery, Text, Divider } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useDBREmissions } from "@app/hooks/useFirm";
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "./DefaultCharts";

const initEvent = { blocknumber: 16196827, timestamp: 1671148800000, txHash: '', amount: 4646000 };

export const DbrEmissions = ({
    maxChartWidth = 800,
    replenishments,
}: {
    maxChartWidth: number
    replenishments: any[]
}) => {
    const [includeInitialEmission, setIncludeInitialEmission] = useState(false);
    const [includeReplenishments, setIncludeReplenishments] = useState(true);
    const [includeClaims, setIncludeClaims] = useState(true);

    const [isSmooth, setIsSmooth] = useState(true);
    const repHashes = replenishments?.map(r => r.txHash) || [];
    const { events: emissionEvents } = useDBREmissions();

    const filteredEvents = includeReplenishments && includeClaims ?
        emissionEvents :
        emissionEvents?.filter(e => {
            return includeReplenishments ? repHashes.includes(e.txHash) : !repHashes.includes(e.txHash);
        });
    const _events = includeInitialEmission ? [initEvent, ...filteredEvents] : filteredEvents;

    const { chartData: emissionChartData } = useEventsAsChartData(_events, '_auto_', 'amount');

    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <Stack w='full' direction={{ base: 'column' }}>
        <HStack spacing="4" justify="space-between" alignItems="center" w='full'>
            <HStack spacing="4" justify="flex-start" alignItems="center">
                <FormControl w='auto' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                    <Text mr="2" onClick={() => setIncludeInitialEmission(!includeInitialEmission)}>
                        Initial emission
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
        <Divider />
        <DefaultCharts
            chartData={emissionChartData}
            maxChartWidth={chartWidth}
            isDollars={false}
            showMonthlyBarChart={true}
            areaProps={{
                interpolation: isSmooth ? "basis" : "stepAfter",
                title: "DBR emissions over time",
                domainYpadding: "auto",
            }}
            barProps={{
                eventName: 'Emission',
                title: 'DBR emissions in the last 12 months'
            }}
        />
    </Stack>
}