import { FormControl, Stack, Switch, Text } from "@chakra-ui/react";
import { useState } from "react";
import { useEventsAsChartData } from "@app/hooks/misc";
import { DefaultCharts } from "./DefaultCharts";
import { timestampToUTC } from "@app/util/misc";

export const DbrEmissions = ({
    chartWidth = 800,
    replenishments,
    histoPrices,
    useUsd = false,
    emissionEvents,
}: {
    chartWidth: number
    replenishments: any[]
    histoPrices: { [key: string]: number }
    useUsd?: boolean
    emissionEvents: any[]
}) => {
    const [includeTreasuryTransfers, setIncludeTreasuryTransfers] = useState(false);
    const [includeTreasuryMints, setIncludeTreasuryMints] = useState(false);
    const [includeReplenishments, setIncludeReplenishments] = useState(true);
    const [includeClaims, setIncludeClaims] = useState(true);

    const repHashes = replenishments?.map(r => r.txHash) || [];

    const filteredEvents = includeReplenishments && includeClaims && includeTreasuryMints ?
        emissionEvents :
        emissionEvents?.filter(e => {
            const repCondition = includeReplenishments ? repHashes.includes(e.txHash) : false;
            const claimCondition = includeClaims ? !repHashes.includes(e.txHash) && !e.isTreasuryMint && !e.isTreasuryTransfer : false;
            const treasuryMintCondition = includeTreasuryMints ? e.isTreasuryMint : false;
            const treasuryTransferCondition = includeTreasuryTransfers ? e.isTreasuryTransfer : false;
            return repCondition || claimCondition || treasuryMintCondition || treasuryTransferCondition;
        });

    const _events = filteredEvents?.map(e => {
        const histoPrice = histoPrices[timestampToUTC(e.timestamp)] || 0.05;
        return { ...e, worth: e.amount * histoPrice };
    });

    const { chartData: emissionChartData } = useEventsAsChartData(_events, '_auto_', useUsd ? 'worth' : 'amount');

    return <Stack maxWidth={`${chartWidth}px`} w='full' direction={{ base: 'column' }}>
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
            chartWidth={chartWidth}
            isDollars={useUsd}
            showMonthlyBarChart={true}
            showAreaChart={false}
            barProps={{
                eventName: 'Issuance',
                title: 'DBR added to the circulating supply in the last 12 months'
            }}
        />
    </Stack>
}