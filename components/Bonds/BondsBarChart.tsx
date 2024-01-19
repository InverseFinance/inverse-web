import { useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { BarChart, BarChartProps } from '@app/components/Transparency/BarChart'
import moment from 'moment'
import { shortenNumber } from '@app/util/markets';
import { useAppTheme } from '@app/hooks/useAppTheme';

const months = [...Array(12).keys()];

export const BondsBarChart = ({
    chartData,
    maxChartWidth = 650,
    ...props
}: {
    chartData: any,
    maxChartWidth?: number,
} & Partial<BarChartProps>) => {
    const { themeStyles } = useAppTheme();
    const defaultColorScale = [themeStyles.colors.secondary, themeStyles.colors.teal[200], themeStyles.colors.teal[300]];
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`)

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 0)
    }, [isLargerThan]);

    const currentYear = new Date().getUTCFullYear();
    const currentMonth = new Date().getUTCMonth();

    const types = [...new Set(chartData.map(d => d.type).filter(type => !!type))];

    const barChartData = types.map(type => {
        return months.map(month => {
            const date = Date.UTC(currentYear, currentMonth - 11 + month);
            
            const filterMonth = new Date(date).getUTCMonth();
            const filterYear = new Date(date).getUTCFullYear();
            
            const y = chartData.filter(d => d.type === type && d.month === filterMonth && d.year === filterYear).reduce((p, c) => p + (c.amount||0), 0);
            const bondVersion = type.indexOf('-v2') !== -1 ? 2 : 1;
            return {
                label: `${type.replace(/-v2/, '')
                    .replace(/(-)([0-9]+$)/, ` - V${bondVersion} bond\n \n$2 days vesting`)}\n \n${shortenNumber(y, 2, false)}`,
                x: moment(date).utc().format(chartWidth <= 400 ? 'MMM' : 'MMM-YY'),
                y,                
            }
        });
    })

    return (
        <BarChart
            width={chartWidth}
            height={300}
            groupedData={barChartData}
            colorScale={defaultColorScale}
            isDollars={false}
            titleProps={{
                style:{ fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontWeight: 'bold', fontSize: chartWidth > 400 ? 20 : undefined },
                y: 10,
            }}
            labelProps={{
                style:{ fill: (props?.colorScale||defaultColorScale)[0], fontFamily: 'Inter', fontWeight: 'bold', fontSize: 12 }
            }}
            {...props}
        />
    )
}