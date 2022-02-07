import { shortenNumber } from '@app/util/markets';
import { VictoryChart, VictoryLabel, VictoryAxis, VictoryArea, VictoryTheme, VictoryClipContainer, VictoryTooltip, VictoryVoronoiContainer, VictoryAreaProps, VictoryAxisProps, VictoryLine } from 'victory';
import { Box, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

type Props = { x: number, y: number }[]

const defaultAxisStyle: VictoryAxisProps["style"] = {
    tickLabels: { fill: '#fff' },
    grid: {
        stroke: ({tick}) => tick === 75 ? 'red' : '#666666aa',
        strokeDasharray: '4 4',
    }
}

export const InterestModelChart = ({
    data,
    title,
    kink,
    width = 900,
    height = 300,
    showLabels = false,
    showTooltips = false,
    interpolation = 'basis',
    axisStyle = defaultAxisStyle,
}: {
    data: Props,
    title?: string,
    kink: number,
    width?: number,
    height?: number,
    showLabels?: boolean,
    showTooltips?: boolean,
    interpolation?: VictoryAreaProps["interpolation"],
    axisStyle?: VictoryAxisProps["style"],
}) => {
    const [isLargerThan] = useMediaQuery('(min-width: 900px)');
    const [rightPadding, setRightPadding] = useState(50);
    const maxY = data.length > 0 ? Math.max(...data.map(d => d.y)) : 95000000;

    useEffect(() => {
        setRightPadding(isLargerThan ? 50 : 20)
    }, [isLargerThan]);

    const xAxisTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].concat([kink]);

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
                containerComponent={!showTooltips ? undefined :
                    <VictoryVoronoiContainer
                        mouseFollowTooltips={true}
                        voronoiDimension="x"
                        labelComponent={<VictoryTooltip centerOffset={{ x: -50 }} cornerRadius={0} flyoutStyle={{ fill: '#8881c9' }} />}
                        // style={{ labels: { fill: 'white' } }}
                        labels={({ datum }) => {
                            return (
                                `For ${datum.x}% Utilisation Rate\n=> ${shortenNumber(datum.y, 2)}% Intest Rate`
                            )
                        }}
                    />
                }
            >
                {
                    !!title && <VictoryLabel text={title} style={{ fill: 'white' }} x={Math.floor(width / 2)} y={30} textAnchor="middle" />
                }
                <VictoryAxis style={axisStyle} dependentAxis tickFormat={(t) => shortenNumber(t, 1)}
                 />
                <VictoryAxis tickValues={xAxisTicks} style={axisStyle} />

                <VictoryArea
                    groupComponent={<VictoryClipContainer clipId="area-chart" />}
                    data={data}
                    labels={
                        ({ data, index }) => {
                            const isMax = (maxY === data[index].y && index > 0 && maxY !== data[index - 1].y);
                            return showLabels || isMax ? `${isMax && 'Max: '}${shortenNumber(data[index].y, 1)}` : ''
                        }
                    }
                    style={{
                        data: { fillOpacity: 0.9, fill: 'url(#primary-gradient)', stroke: '#8881c9', strokeWidth: 1 },
                        labels: { fill: 'white' }
                    }}
                    interpolation={interpolation}
                />
            </VictoryChart>
        </Box >
    )
}