import { Stack, useMediaQuery } from "@chakra-ui/react";
import { AreaChart } from "./AreaChart"
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";

export const DbrIncome = ({
    chartData,
    maxChartWidth = 1300,
}) => {
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const { themeStyles } = useAppTheme();
    const defaultColorScale = [themeStyles.colors.secondary];

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <Stack w='full' direction={{ base: 'column' }}>
        <AreaChart
            showTooltips={true}
            height={300}
            width={chartWidth}
            data={chartData}
            domainYpadding={1000}
            mainColor="secondary"
            isDollars={true}
            title="Replenishments income over time"
            useRecharts={true}
            yLabel="Accumulated replenishment income"
        />
        <BarChart12Months useRecharts={true} title="Replenishments income in the last 12 months" chartData={chartData} maxChartWidth={chartWidth} chartWidth={chartWidth} eventName="Income" yAttribute="yDay" colorScale={defaultColorScale} isDollars={true} />
    </Stack>
}