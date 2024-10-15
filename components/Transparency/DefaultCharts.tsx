import { Stack, useMediaQuery, HStack, Text, Switch, StackProps } from "@chakra-ui/react";
import { AreaChart, AreaChartProps } from "./AreaChart"
import { useEffect, useState } from "react";
import { BarChart12Months, BarChart12MonthsProps } from "./BarChart12Months";
import { useAppTheme } from "@app/hooks/useAppTheme";
import { CoordinatesArray } from "@app/types";

export const DefaultCharts = ({
    chartData,
    maxChartWidth = 800,
    chartWidth,
    areaProps,
    barProps,
    isDollars,
    isPerc,
    showAreaChart = true,
    showMonthlyBarChart = false,
    direction = 'column',
    showCustomizationBar = false,
    smoothLineByDefault = true,
    custombarChildren,
    containerProps,
}: {
    chartData: CoordinatesArray,
    maxChartWidth?: number,
    chartWidth?: number,
    areaProps?: Partial<AreaChartProps>,
    barProps?: Partial<BarChart12MonthsProps>,
    isDollars?: boolean
    isPerc?: boolean
    showAreaChart?: boolean
    showMonthlyBarChart?: boolean
    showCustomizationBar?: boolean
    smoothLineByDefault?: boolean
    custombarChildren?: any
    direction?: 'column' | 'row'
    containerProps?: StackProps
}) => {
    const [useSmoothLine, setUseSmoothLine] = useState(smoothLineByDefault);
    const [autoChartWidth, setAutoChartWidth] = useState<number>(maxChartWidth);
    const [isLargerThan] = useMediaQuery(`(min-width: ${maxChartWidth}px)`);
    const { themeStyles } = useAppTheme();
    const defaultColorScale = [themeStyles.colors.secondary];

    useEffect(() => {
        setAutoChartWidth(isLargerThan ? maxChartWidth : (screen.availWidth || screen.width) - 40)
    }, [isLargerThan]);

    const _chartWidth = chartWidth || autoChartWidth;

    return <Stack w='full' direction={direction} justify="space-between" alignItems="center" {...containerProps}>
        {
            showCustomizationBar && <Stack w='full' direction={{ base: 'column', md: 'row' }} justify="space-between">
                <HStack>
                    <Text fontSize="16px">
                        Smooth line
                    </Text>
                    <Switch value="true" isChecked={useSmoothLine} onChange={() => setUseSmoothLine(!useSmoothLine)} />
                </HStack>
                {custombarChildren}
            </Stack>
        }
        {
            showAreaChart && <AreaChart
                showTooltips={true}
                height={300}
                width={_chartWidth}
                data={chartData}
                domainYpadding={'auto'}
                mainColor="secondary"
                isDollars={isDollars}
                isPerc={isPerc}
                interpolation={areaProps?.interpolation || (useSmoothLine ? 'basis' : 'stepAfter')}
                {...areaProps}
            />
        }
        {
            showMonthlyBarChart && <BarChart12Months
                chartData={chartData}
                maxChartWidth={maxChartWidth}
                chartWidth={_chartWidth}
                colorScale={defaultColorScale}
                isDollars={isDollars}
                eventName="Value"
                yAttribute="yDay"
                {...barProps}
            />
        }
    </Stack>
}