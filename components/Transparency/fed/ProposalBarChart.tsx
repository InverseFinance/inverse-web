import { useMediaQuery } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { BarChart } from '@app/components/Transparency/BarChart'
import moment from 'moment'
import { shortenNumber } from '@app/util/markets';
import { useAppTheme } from '@app/hooks/useAppTheme';

const months = [...Array(12).keys()];

export const ProposalBarChart = ({ chartData, maxChartWidth = 900, ...props }: { chartData: any, maxChartWidth?: number }) => {
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`)
    const { themeStyles } = useAppTheme();

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 20)
    }, [isLargerThan]);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const barChartData = ['Active', 'Passed', 'Failed']
        .map(type => {
            return months.map(month => {
                const date = Date.UTC(currentYear, currentMonth - 11 + month);
                const filterMonth = new Date(date).getMonth();
                const filterYear = new Date(date).getFullYear();
                const y = chartData.filter(d => d.type === type && d.month === filterMonth && d.year === filterYear).length

                return {
                    label: `${type}: ${shortenNumber(y, 2, false)}`,
                    x: moment(date).format('MMM'),
                    y,
                }
            });
        })

    return (
        <BarChart
            width={chartWidth}
            height={300}
            title=""
            groupedData={barChartData}
            colorScale={[themeStyles.colors.mainTextColor, themeStyles.colors.secondary, themeStyles.colors.secondaryTextColor]}
            isDollars={false}
            precision={0}
            {...props}
        />
    )
}