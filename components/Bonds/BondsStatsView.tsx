import { Stack } from '@chakra-ui/react';
import { shortenNumber } from '@app/util/markets';
import { useBondsDeposits } from '@app/hooks/useBonds';
import { BondsAreaChart } from './BondsAreaChart';

export const BondsStatsView = () => {
    const { deposits, acc } = useBondsDeposits();

    const invExchanged = deposits?.map(d => {
        return {
            x: d.timestamp,
            y: d.accOutputAmount,
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
                    return {
                        x: d.timestamp,
                        y: d.accInputAmount,
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
    })

    return (
        <Stack w='full' color="mainTextColor">
            <BondsAreaChart
                title={`Total INV sold over time (${shortenNumber(acc?.output)})`}
                chartData={invExchanged}
                showMaxY={false}
            />
            {
                inputReceived.map(d => {
                    return <BondsAreaChart
                        title={`Total ${d.name} received over time (${shortenNumber(acc[d.name])})`}
                        chartData={d.data}
                        showMaxY={false}
                    />
                })
            }
        </Stack>
    )
}