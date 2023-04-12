import { Stack, useMediaQuery } from "@chakra-ui/react";
import { AreaChart } from "./AreaChart"
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";

export const DbrBurns = ({
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
            domainYpadding={10000}
            mainColor="secondary"
            isDollars={false}
            title="DBR burns over time"
        />
        <BarChart12Months
            title="DBR burns in the last 12 months"
            chartData={chartData}
            maxChartWidth={chartWidth}
            eventName="Burn"
            yAttribute="yDay"
            colorScale={defaultColorScale}
            isDollars={false}
        />
    </Stack>
}