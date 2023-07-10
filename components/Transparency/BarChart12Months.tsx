import { useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { BarChart, BarChartProps } from './BarChart'
import moment from 'moment'
import { smartShortNumber } from '@app/util/markets';
import { CoordinatesArray } from '@app/types';

const DEFAULT_MONTHS = [...Array(12).keys()];

export type BarChart12MonthsProps = {
    chartData: CoordinatesArray,
    maxChartWidth?: number,
    chartWidth?: number,
    eventName: string,
    yAttribute: string,
    isDollars?: boolean,
    xDateFormat?: string,
    months?: number[],
}

export const BarChart12Months = ({
    chartData,
    maxChartWidth = 900,
    chartWidth = 900,
    eventName,
    yAttribute,
    isDollars,
    xDateFormat = '',
    months = DEFAULT_MONTHS,
    ...props
}: BarChart12MonthsProps & Omit<BarChartProps, "groupedData">) => {
    const [_chartWidth, setChartWidth] = useState<number>(chartWidth||maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${chartWidth||maxChartWidth}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth();
    const nbMonths = months.length;

    const barChartData = [eventName].map(event => {
        return months.map(month => {
            const date = Date.UTC(currentYear, currentMonth - (nbMonths-1) + month);
            const filterMonth = new Date(date).getUTCMonth();
            const filterYear = new Date(date).getUTCFullYear();
            const y = chartData.filter(d => d.month === filterMonth && d.year === filterYear).reduce((p, c) => p + c[yAttribute], 0);

            return {
                label: `${event}s: ${smartShortNumber(y, 2, isDollars)}`,
                x: moment(date).utc().format(xDateFormat || (_chartWidth <= 400 ? 'MMM' : 'MMM-YY')),
                y,
            }
        });
    })

    return (
        <BarChart
            width={_chartWidth}        
            isDollars={isDollars}
            yLabel={eventName}
            {...props}
            groupedData={barChartData}
        />
    )
}