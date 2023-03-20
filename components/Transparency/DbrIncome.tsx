import { Stack, useMediaQuery } from "@chakra-ui/react";
import { AreaChart } from "./AreaChart"
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";

export const DbrIncome = ({
    chartData,
    maxChartWidth = 800,
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
            title="Accumulated DOLA income over time from replenishments"
        />
        <BarChart12Months title="DOLA income in the last 12 months from replenishments" chartData={chartData} maxChartWidth={chartWidth} eventName="Income" yAttribute="yDay" colorScale={defaultColorScale} isDollars={true} />
    </Stack>
}