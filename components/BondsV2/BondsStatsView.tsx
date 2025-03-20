import { Stack, Text, VStack } from '@chakra-ui/react';
import { shortenNumber } from '@app/util/markets';
import { useBondsDeposits } from '@app/hooks/useBonds';
import { BondsAreaChart } from './BondsAreaChart';
import { BondsBarChart } from './BondsBarChart';
import theme from '@app/variables/theme';
import { SkeletonBlob } from '@app/components/common/Skeleton';
 ;

export const BondsStatsView = () => {
    const { deposits, acc, lastUpdate } = useBondsDeposits();

    const invExchanged = deposits?.map(d => {
        const date = new Date(d.timestamp);
        return {
            x: d.timestamp,
            y: d.accOutputAmount,
            type: 'INV',
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
            amount: d.outputAmount,
        }
    });

    const minTimestamp = invExchanged[0]?.x - 3600 * 24 * 1000;
    const maxTimestamp = new Date().getTime();

    const inputs = ['DOLA', 'INV-DOLA-SLP', 'DOLA-3POOL'];

    const inputReceived = inputs.map(input => {
        return {
            name: input,
            data: deposits?.filter(d => d.input === input)
                .map(d => {
                    const date = new Date(d.timestamp);
                    return {
                        x: d.timestamp,
                        y: d.accInputAmount,
                        duration: d.duration,
                        type: d.type,
                        month: date.getUTCMonth(),
                        year: date.getUTCFullYear(),
                        amount: d.inputAmount,
                    }
                })
        }
    });

    inputs.forEach((input, i) => {
        if (inputReceived[i].data[0]) {
            inputReceived[i].data.unshift({
                x: minTimestamp,
                y: 0,
            });
            inputReceived[i].data.push({
                x: maxTimestamp,
                y: inputReceived[i].data[inputReceived[i].data.length - 1].y,
            });
        }
    });

    return (
        <VStack spacing="4" pt="8" w='full'>
            <Stack  spacing="10"  color="mainTextColor" direction={{ base: 'column', lg: 'row' }}>
                <VStack w={{ base: 'full', lg: '50%' }} spacing="10">
                    {
                        !deposits?.length ?
                            <SkeletonBlob />
                            :
                            <>
                                <BondsAreaChart
                                    title={`Total INV exchanged for bonds over time (${shortenNumber(acc?.output)})`}
                                    chartData={invExchanged}
                                    showMaxY={false}
                                    mainColor="info"
                                />
                                {
                                    inputReceived.map(d => {
                                        return <BondsAreaChart
                                            key={d.name}
                                            title={`Total ${d.name} bonded over time (${shortenNumber(acc[d.name])})`}
                                            chartData={d.data}
                                            showMaxY={false}
                                            mainColor="secondary"
                                        />
                                    })
                                }
                            </>
                    }
                </VStack>
                <VStack w={{ base: 'full', lg: '50%' }} spacing="10">
                    {
                        !deposits?.length ?
                            <SkeletonBlob />
                            :
                            <>
                                <BondsBarChart
                                    title={`Monthly INV exchanged for bonds`}
                                    chartData={invExchanged}
                                    colorScale={[theme.colors.info]}
                                />
                                {
                                    inputReceived.map(d => {
                                        return <BondsBarChart
                                            key={d.name}
                                            title={`Monthly ${d.name} bonded`}
                                            chartData={d.data}
                                        />
                                    })
                                }
                            </>
                    }
                </VStack>
            </Stack>
            <Text color="secondaryTextColor">
                { lastUpdate ? `Last update: ${timeSince(lastUpdate)}` : 'Loading...' }
            </Text>
        </VStack>
    )
}