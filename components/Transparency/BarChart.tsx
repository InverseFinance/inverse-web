import { VictoryChart, VictoryLabel, VictoryAxis, VictoryTheme, VictoryAreaProps, VictoryAxisProps, VictoryStack, VictoryBar } from 'victory';

import { Box, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

type Props = { x: number, y: number }[]

const defaultAxisStyle: VictoryAxisProps["style"] = {
    tickLabels: { fill: '#fff', fontFamily: 'Inter', fontSize: '12px' },
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
    showLabels = false,
    showTooltips = false,
    showMaxY = true,
    interpolation = 'basis',
    axisStyle = defaultAxisStyle,
    domainYpadding = 0,
    mainColor = 'primary',
}: {
    groupedData: Props,
    title?: string,
    width?: number,
    height?: number,
    showLabels?: boolean,
    showTooltips?: boolean,
    showMaxY?: boolean,
    interpolation?: VictoryAreaProps["interpolation"],
    axisStyle?: VictoryAxisProps["style"],
    domainYpadding?: number,
    mainColor?: 'primary' | 'secondary'
}) => {
    const [isLargerThan] = useMediaQuery('(min-width: 900px)');
    const [rightPadding, setRightPadding] = useState(50);

    useEffect(() => {
        setRightPadding(isLargerThan ? 50 : 20)
    }, [isLargerThan]);

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
                scale={{ x: "time" }}
                padding={{ top: 50, bottom: 50, left: 50, right: rightPadding }}
            // containerComponent={!showTooltips ? undefined :
            //     <VictoryVoronoiContainer
            //         mouseFollowTooltips={true}
            //         voronoiDimension="x"
            //         labelComponent={<VictoryTooltip flyoutPadding={10} centerOffset={{ x: -50 }} cornerRadius={10} flyoutStyle={{ fill: '#8881c966' }} />}
            //         labels={({ datum }) => {
            //             return (
            //                 moment(datum.x).format('MMM Do YYYY') + '\n' + shortenNumber(datum.y, 1)
            //             )
            //         }}
            //     />
            // }
            >
                {
                    !!title && <VictoryLabel text={title} style={{ fill: 'white', fontFamily: 'Inter' }} x={Math.floor(width / 2)} y={30} textAnchor="middle" />
                }
                {/* <VictoryAxis style={axisStyle} dependentAxis tickFormat={(t) => shortenNumber(t, 1)} />
                <VictoryAxis style={axisStyle} /> */}
                <VictoryAxis
                    tickCount={12}
                    tickFormat={date => date.toLocaleString("default", { month: "short" })}
                    style={defaultAxisStyle}
                />
                <VictoryAxis
                    dependentAxis
                    label="Total # of Songs"
                    style={defaultAxisStyle}
                />
                <VictoryStack>
                    {Object.entries(groupedData).map(([key, dataGroup]) => {
                        return (
                            <VictoryBar
                                key={key}
                                data={dataGroup}
                                colorScale="green"
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