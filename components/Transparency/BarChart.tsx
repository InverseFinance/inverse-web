import { VictoryChart, VictoryTooltip, VictoryLabel, VictoryAxis, VictoryTheme, VictoryAxisProps, VictoryStack, VictoryBar, VictoryLabelProps } from 'victory';

import { Box, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { smartShortNumber } from '@app/util/markets';
import { useAppTheme } from '@app/hooks/useAppTheme';
import { BarChartRecharts } from './BarChartRecharts';

type Props = { x: string, y: number, label?: string }[][]

export type BarChartProps = {
    groupedData: Props,
    title?: string,
    width?: number,
    height?: number,
    isDollars?: boolean,
    colorScale?: string[],
    precision?: number
    yTickPrecision?: number
    labelProps?: VictoryLabelProps | any,
    titleProps?: VictoryLabelProps,
    isPercentages?: boolean
    useRecharts?: boolean
    axisStyle?: VictoryAxisProps["style"]
    yLabel?: string
    showLabel?: boolean
}

export const BarChart = ({
    groupedData,
    title,
    width = 900,
    height = 300,
    colorScale,
    isDollars = false,
    precision = 2,
    yTickPrecision = 0,
    labelProps,
    titleProps,
    isPercentages = false,
    useRecharts = false,
    axisStyle,
    yLabel,
    showLabel = true
}: BarChartProps) => {
    const [isLargerThan] = useMediaQuery(`(min-width: 900px)`);
    const [rightPadding, setRightPadding] = useState(useRecharts ? 50 : 65);
    const { themeStyles } = useAppTheme();

    useEffect(() => {
        setRightPadding(isLargerThan ? useRecharts ? 50 : 65 : 20)
    }, [isLargerThan]);

    const totals = {};

    if(useRecharts) {
        return <BarChartRecharts
            combodata={groupedData.length > 0 ? groupedData[0] : []}
            yLabel={yLabel}
            useUsd={isDollars}
            title={title}
            chartWidth={width}
            chartHeight={height}
            rightPadding={rightPadding}
            showLabel={showLabel}
        />
    }

    Object.values(groupedData).forEach((groupValues) => {
        groupValues.forEach(categoryValues => {
            if (!totals[categoryValues.x]) { totals[categoryValues.x] = 0 }
            totals[categoryValues.x] += categoryValues.y;
        })
    })

    const lightMode = width <= 400;

    const defaultAxisStyle: VictoryAxisProps["style"] = {
        ...axisStyle,
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '12px', padding: 13, ...axisStyle?.tickLabels },
        grid: {
            stroke: '#66666633',
            strokeDasharray: '4 4',
            ...axisStyle?.grid,
        }
    }

    return (
        <Box
            width={width}
            height={height}
            position="relative"
        >
            <VictoryChart
                width={width}
                height={height}
                theme={VictoryTheme.grayscale}
                animate={{ duration: 500 }}
                padding={{ top: 50, bottom: 50, left: 50, right: rightPadding }}
            >
                {
                    !!title && <VictoryLabel
                        text={title}
                        style={{ fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '16px' }}
                        x={Math.floor(width / 2)}
                        y={10}
                        textAnchor="middle"  {...titleProps} />
                }
                <VictoryAxis
                    style={defaultAxisStyle}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={y => `${smartShortNumber(y, yTickPrecision, isDollars)}${isPercentages ? '%' : ''}`}
                    style={defaultAxisStyle}
                />
                <VictoryBar
                    alignment="middle"
                    labelComponent={showLabel ? <VictoryLabel style={{ fontFamily: 'Inter', fontSize: '13px', fill: lightMode ? 'transparent' : themeStyles.colors.secondary, fontWeight: '600' }} dy={-10} {...labelProps} /> : undefined}
                    data={Object.entries(totals).map(([key, value]) => ({ x: key, y: value, label: value ? smartShortNumber(value, precision, isDollars) : '' }))}
                    style={{
                        data: { strokeWidth: 0, fill: 'transparent', fontWeight: 'bold' }
                    }}
                />
                <VictoryStack domain={{ x: [0.5, 1], y: [0, isPercentages ? 100: 0] }} colorScale={colorScale}>
                    {Object.entries(groupedData).map(([key, dataGroup]) => {
                        return (
                            <VictoryBar
                                alignment="middle"
                                labelComponent={<VictoryTooltip flyoutPadding={10} cornerRadius={10} style={{ fill: '#fff', fontFamily: 'Inter' }} flyoutStyle={{ fill: themeStyles.colors.darkPrimary, stroke: '#fff' }} />}
                                key={key}
                                data={dataGroup}
                                style={{
                                    data: { strokeWidth: 0 }
                                }}
                            />
                        );
                    })}
                </VictoryStack>
            </VictoryChart>
        </Box >
    )
}