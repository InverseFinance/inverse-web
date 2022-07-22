import { useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { AreaChart } from '@app/components/Transparency/AreaChart'

export const BondsAreaChart = ({
    chartData,
    onlyChart = false,
    maxChartWidth = 900,
    ...props
}: {
    chartData: any,
    onlyChart?: boolean,
    maxChartWidth?: number
}) => {
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return (
        <>
            <AreaChart
                showTooltips={true}
                height={300}
                width={chartWidth}
                data={chartData}
                interpolation='stepAfter'
                {...props}
            />
        </>
    )
}