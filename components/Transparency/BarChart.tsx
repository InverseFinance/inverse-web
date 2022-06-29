import { VictoryChart, VictoryTooltip, VictoryLabel, VictoryAxis, VictoryTheme, VictoryAxisProps, VictoryStack, VictoryBar } from 'victory';

import { Box, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { shortenNumber } from '@app/util/markets';

type Props = { x: string, y: number, label?: string }[][]

const defaultAxisStyle: VictoryAxisProps["style"] = {
    tickLabels: { fill: '#fff', fontFamily: 'Inter', fontSize: '12px', padding: 14 },
    grid: {
        stroke: '#666666aa',
        strokeDasharray: '4 4',
    }
}

export const BarChart = ({
    groupedData,
    title,
    width = 900,
    height = 300,
    colorScale,
    isDollars = false,
    precision = 2,
}: {
    groupedData: Props,
    title?: string,
    width?: number,
    height?: number,
    isDollars?: boolean,
    colorScale?: string[],
    precision?: number
}) => {
    const [isLargerThan] = useMediaQuery('(min-width: 900px)');
    const [rightPadding, setRightPadding] = useState(65);

    useEffect(() => {
        setRightPadding(isLargerThan ? 65 : 20)
    }, [isLargerThan]);

    const totals = {};

    Object.values(groupedData).forEach((groupValues) => {
        groupValues.forEach(categoryValues => {
            if (!totals[categoryValues.x]) { totals[categoryValues.x] = 0 }
            totals[categoryValues.x] += categoryValues.y;
        })
    })

    const lightMode = width <= 400;

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
                    !!title && <VictoryLabel text={title} style={{ fill: 'white', fontFamily: 'Inter' }} x={Math.floor(width / 2)} y={10} textAnchor="middle" />
                }
                <VictoryAxis
                    style={defaultAxisStyle}
                />
                <VictoryAxis
                    dependentAxis
                    tickFormat={y => shortenNumber(y, 0, isDollars)}
                    style={defaultAxisStyle}
                />
                <VictoryBar
                    alignment="middle"
                    labelComponent={<VictoryLabel style={{ fontFamily: 'Inter', fontSize: '12px', fill: lightMode ? 'transparent' : '#34E795' }} dy={-10} />}
                    data={Object.entries(totals).map(([key, value]) => ({ x: key, y: value, label: shortenNumber(value, precision, isDollars) }))}
                    style={{
                        data: { strokeWidth: 0, fill: 'transparent', fontWeight: 'bold' }
                    }}
                />
                <VictoryStack colorScale={colorScale}>
                    {Object.entries(groupedData).map(([key, dataGroup]) => {
                        return (
                            <VictoryBar
                                alignment="middle"
                                labelComponent={<VictoryTooltip flyoutPadding={10} cornerRadius={10} style={{ fill: '#fff', fontFamily: 'Inter' }} flyoutStyle={{ fill: '#8881c9ee' }} />}
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