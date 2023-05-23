import { Stack, useMediaQuery } from "@chakra-ui/react";
import { AreaChart } from "./AreaChart"
import { useEffect, useState } from "react";
import { BarChart12Months } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { useDBREmissions } from "@app/hooks/useFirm";
import { useEventsAsChartData } from "@app/hooks/misc";

export const DbrEmissions = ({    
    maxChartWidth = 800,
}) => {
    const { events: emissionEvents } = useDBREmissions();
    const { chartData: emissionChartData } = useEventsAsChartData(emissionEvents, 'accEmissions', 'amount');

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
            data={emissionChartData}
            domainYpadding={'auto'}
            mainColor="secondary"
            isDollars={false}
            title="DBR emissions over time"
            yTickPrecision={2}
        />
        <BarChart12Months
            title="DBR emissions in the last 12 months"
            chartData={emissionChartData}
            maxChartWidth={chartWidth}
            eventName="Burn"
            yAttribute="yDay"
            colorScale={defaultColorScale}
            isDollars={false}
            yTickPrecision={2}
        />
    </Stack>
}