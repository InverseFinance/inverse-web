import { Stack, useMediaQuery } from "@chakra-ui/react";
import { AreaChart } from "./AreaChart"
import { useEffect, useState } from "react";

export const DbrDebt = ({
    chartData,
    maxChartWidth = 800,
}) => {
    const [chartWidth, setChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);

    useEffect(() => {
        setChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    return <Stack w='full' direction={{ base: 'column' }}>
        <AreaChart
            showTooltips={true}
            height={300}
            width={chartWidth}
            data={chartData}
            domainYpadding={200000}
            mainColor="secondary"
            isDollars={false}
            title="DBR annualized burn-rate over time"
        />
    </Stack>
}