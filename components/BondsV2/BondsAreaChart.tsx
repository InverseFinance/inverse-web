import { useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { AreaChart, AreaChartProps } from '@app/components/Transparency/AreaChart'

export const BondsAreaChart = ({
    chartData,
    onlyChart = false,
    maxChartWidth = 600,
    ...props
}: {
    chartData: any,
    onlyChart?: boolean,
    maxChartWidth?: number
} & Partial<AreaChartProps>) => {
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 0)
    }, [isLargerThan]);

    return (
        <>
            <AreaChart
                showTooltips={true}
                height={300}
                width={chartWidth}
                data={chartData}
                titleProps={{
                    style:{ fill: 'white', fontFamily: 'Inter', fontWeight: 'bold', fontSize: chartWidth > 400 ? 20 : undefined },
                    y: 10,
                }}            
                {...props}
            />
        </>
    )
}