import { shortenNumber } from '@app/util/markets';
import { VictoryChart, VictoryLabel, VictoryAxis, VictoryArea, VictoryTheme, VictoryClipContainer, VictoryTooltip, VictoryVoronoiContainer, VictoryAreaProps, VictoryAxisProps, VictoryLine } from 'victory';
import { Box, BoxProps, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { SkeletonBlob } from '@app/components/common/Skeleton';
import theme from '@app/variables/theme';

type Props = { x: number, y: number }[]

const formatTick = (t: number) => (t % 2 === 0 ? t : shortenNumber(t, 2)) + '%'

export const InterestModelChart = ({
    data,
    title,
    kink,
    utilizationRate,
    width = 900,
    height = 300,
    autocompounds = true,
    showLabels = false,
    showTooltips = false,
    interpolation = 'basis',
    ...props
}: {
    data: Props,
    title?: string,
    kink: number,
    utilizationRate: number,
    autocompounds?: boolean,
    width?: number,
    height?: number,
    showLabels?: boolean,
    showTooltips?: boolean,
    interpolation?: VictoryAreaProps["interpolation"],
    props?: BoxProps
}) => {
    const [isLargerThan] = useMediaQuery('(min-width: 900px)');
    const [rightPadding, setRightPadding] = useState(60);
    const [titleFontSize, setTitleFontSize] = useState(20);
    const [isLightMode, setIsLightMode] = useState(!isLargerThan || width <= 400);
    const maxY = data.length > 0 ? Math.max(...data.map(d => d.y)) : 95000000;

    useEffect(() => {
        setRightPadding(!isLightMode ? 60 : 20)
        setTitleFontSize(!isLightMode ? 20 : 12)
    }, [isLightMode]);

    useEffect(() => {
        setIsLightMode(!isLargerThan || width <= 400)
    }, [isLargerThan, width]);

    const defaultAxisStyle: VictoryAxisProps["style"] = {
        tickLabels: {
            fill: ({ tick }) => tick === kink ? '#ed8936' : tick === utilizationRate ? '#34E795' : '#fff',
            padding: ({ tick }) => {
                const isKink = tick === kink
                const isUr = tick === utilizationRate
                return isKink ? -200 : isUr ? -150 : 1
            },
            fontWeight: 'bold',
            fontFamily: 'Inter',
        },
        axisLabel: { fill: '#fff', padding: 35, fontFamily: 'Inter' },
        grid: {
            stroke: ({ tick }) => tick === kink ? '#ed8936' : tick === utilizationRate ? '#34E795' : '#666666aa',
            strokeDasharray: '4 4',
        }
    }

    const defaultYAxis = {
        ...defaultAxisStyle,
        axisLabel: { ...defaultAxisStyle?.axisLabel, padding: 65 },
    }

    const xAxisTicks = (!isLightMode ?
        [0, 20, 40, 60, 80, 100]
        :
        [0, 50, 100])

    if (typeof utilizationRate == 'number' && !isNaN(utilizationRate) && typeof kink == 'number' && !isNaN(kink)) {
        xAxisTicks.push(kink);
        xAxisTicks.push(utilizationRate);
        xAxisTicks.sort((a, b) => a - b);
    }

    // note: we use two charts one VictoryVoronoiContainer and the other without, it avoids visual glitch due to voronoi and still have the hover tooltip
    return (
        <Box
            width={width}
            height={height}
            position="relative"
            {...props}
        >
            {
                !kink || !utilizationRate ?
                    <SkeletonBlob width={width} maxW="800px" />
                    :
                    <>
                        <Box position="absolute">
                            <VictoryChart
                                width={width}
                                height={height}
                                theme={VictoryTheme.grayscale}
                                animate={{ duration: 500 }}
                                padding={{ top: 50, bottom: 50, left: isLightMode ? 50 : 80, right: rightPadding }}
                            >
                                <VictoryAxis label={isLightMode ? '' : 'Interest Rate'} style={defaultYAxis} dependentAxis tickFormat={(t) => formatTick(t)} />
                                <VictoryAxis label="Utilization Rate" tickValues={xAxisTicks} style={defaultAxisStyle} tickFormat={(t) => formatTick(t)} />
                                <VictoryArea
                                    groupComponent={<VictoryClipContainer clipId="area-chart" />}
                                    data={data}
                                    labels={
                                        ({ data, index }) => {
                                            const isMax = (maxY === data[index].y && index > 0 && maxY !== data[index - 1].y);
                                            const isCurrentUR = data[index].x === utilizationRate;
                                            if (isCurrentUR) { return `Current ${autocompounds ? 'APY' : 'APR'}: ${shortenNumber(data[index].y, 2)}%` }
                                            return showLabels || (isMax && !isLightMode) ? `${isMax && 'Max: '}${shortenNumber(data[index].y, 2)}%` : ''
                                        }
                                    }
                                    labelComponent={
                                        <VictoryLabel
                                            dx={-rightPadding - 20}
                                            dy={(a) => a.datum.x === 100 ? 0 : -20}
                                            textAnchor="start"
                                            verticalAnchor="start"
                                        />
                                    }
                                    style={{
                                        data: { fillOpacity: 0.9, fill: 'url(#primary-gradient)', stroke: '#8881c9', strokeWidth: 1 },
                                        labels: { fill: 'white', fontSize: '12px', fontWeight: 'bold', fontFamily: 'Inter' }
                                    }}
                                    interpolation={interpolation}
                                />
                            </VictoryChart>
                        </Box>
                        <VictoryChart
                            width={width}
                            height={height}
                            theme={VictoryTheme.grayscale}
                            animate={{ duration: 500 }}
                            padding={{ top: 50, bottom: 50, left: 80, right: rightPadding }}
                            containerComponent={!showTooltips ? undefined :
                                <VictoryVoronoiContainer
                                    mouseFollowTooltips={true}
                                    voronoiDimension="x"
                                    labelComponent={<VictoryTooltip flyoutPadding={15} centerOffset={{ x: -50 }} cornerRadius={10} flyoutStyle={{ fill: theme.colors.darkPrimary, stroke: '#fff' }} />}
                                    labels={({ datum }) => {
                                        return (
                                            `For ${shortenNumber(datum.x, 2)}% Utilisation Rate\n=> ${shortenNumber(datum.y, 2)}% Intest Rate`
                                        )
                                    }}
                                />
                            }
                        >
                            {
                                !!title && <VictoryLabel text={title} style={{ fill: 'white', fontSize: titleFontSize, fontWeight: 'bold', fontFamily: 'Inter' }} x={Math.floor(width / 2)} y={30} textAnchor="middle" />
                            }
                            <VictoryAxis dependentAxis tickFormat={() => ''} />
                            <VictoryArea
                                data={data}
                                style={{
                                    data: { fillOpacity: 0, strokeWidth: 0 },
                                    labels: { fill: 'white', fontSize: '12px', fontWeight: 'bold', fontFamily: 'Inter' }
                                }}
                                interpolation={interpolation}
                            />
                        </VictoryChart>
                    </>
            }
        </Box >
    )
}