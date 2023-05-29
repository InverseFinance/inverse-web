import { useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { BarChart, BarChartProps } from './BarChart'
import moment from 'moment'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { CoordinatesArray } from '@app/types';

const months = [...Array(12).keys()];

export type BarChart12MonthsProps = {
    chartData: CoordinatesArray,
    maxChartWidth?: number,
    eventName: string,
    yAttribute: string,
    isDollars?: boolean,
}

export const BarChart12Months = ({
    chartData,
    maxChartWidth = 900,
    eventName,
    yAttribute,
    isDollars,
    ...props
}: BarChart12MonthsProps & Omit<BarChartProps, "groupedData">) => {
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth();

    const barChartData = [eventName].map(event => {
        return months.map(month => {
            const date = Date.UTC(currentYear, currentMonth - 11 + month);
            const filterMonth = new Date(date).getUTCMonth();
            const filterYear = new Date(date).getUTCFullYear();
            const y = chartData.filter(d => d.month === filterMonth && d.year === filterYear).reduce((p, c) => p + c[yAttribute], 0);

            return {
                label: `${event}s: ${smartShortNumber(y, 2, isDollars)}`,
                x: moment(date).utc().format(chartWidth <= 400 ? 'MMM' : 'MMM-YY'),
                y,
            }
        });
    })

    return (
        <BarChart
            width={chartWidth}            
            isDollars={isDollars}
            {...props}
            groupedData={barChartData}
        />
    )
}