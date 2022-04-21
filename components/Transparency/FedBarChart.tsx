import theme from '@app/variables/theme';
import { useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { BarChart } from './BarChart'

export const FedBarChart = ({ chartData, ...props }: { chartData: any }) => {
    const [chartWidth, setChartWidth] = useState<number>(900);
    const [isLargerThan] = useMediaQuery('(min-width: 900px)')

    useEffect(() => {
        setChartWidth(isLargerThan ? 900 : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return (
        <BarChart
            width={chartWidth}
            height={300}
            title="Monthly profits for the last 12 months"
            groupedData={chartData}
            colorScale={[theme.colors.secondary]}
            isDollars={true}
            {...props}
        />
    )
}