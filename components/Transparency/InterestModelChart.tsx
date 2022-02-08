import { shortenNumber } from '@app/util/markets';
import { VictoryChart, VictoryLabel, VictoryAxis, VictoryArea, VictoryTheme, VictoryClipContainer, VictoryTooltip, VictoryVoronoiContainer, VictoryAreaProps, VictoryAxisProps, VictoryLine } from 'victory';
import { Box, BoxProps, useMediaQuery } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { SkeletonBlob } from '@app/components/common/Skeleton';

type Props = { x: number, y: number }[]

export const InterestModelChart = ({
    data,
    title,
    kink,
    utilizationRate,
    width = 900,
    height = 300,
    showLabels = false,
    showTooltips = false,
    interpolation = 'basis',
    ...props
}: {
    data: Props,
    title?: string,
    kink: number,
    utilizationRate: number,
    width?: number,
    height?: number,
    showLabels?: boolean,
    showTooltips?: boolean,
    interpolation?: VictoryAreaProps["interpolation"],
    props?: BoxProps
}) => {
    const [isLargerThan] = useMediaQuery('(min-width: 900px)');
    const [rightPadding, setRightPadding] = useState(50);
    const [titleFontSize, setTitleFontSize] = useState(20);
    const maxY = data.length > 0 ? Math.max(...data.map(d => d.y)) : 95000000;

    useEffect(() => {
        setRightPadding(isLargerThan ? 50 : 20)
        setTitleFontSize(isLargerThan ? 20 : 12)
    }, [isLargerThan]);

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

    const xAxisTicks = (isLargerThan ?
        [0, 20, 40, 60, 80, 100]
        :
        [0, 50, 100])

    if (typeof utilizationRate == 'number' && !isNaN(utilizationRate) && typeof kink == 'number' && !isNaN(kink)) {
        xAxisTicks.push(kink);
        xAxisTicks.push(utilizationRate);
        xAxisTicks.sort((a, b) => a - b);
    }

    return (
        <Box
            width={width}
            height={height}
            position="relative"
            {...props}
        >
            {
                !kink || !utilizationRate ?
                <SkeletonBlob />
                :
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
                        labelComponent={<VictoryTooltip centerOffset={{ x: -50 }} cornerRadius={0} flyoutStyle={{ fill: '#8881c9' }} />}
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
                
                <VictoryArea
                    groupComponent={<VictoryClipContainer clipId="area-chart" />}
                    data={data}
                    labels={
                        ({ data, index }) => {
                            const isMax = (maxY === data[index].y && index > 0 && maxY !== data[index - 1].y);
                            const isCurrentUR = data[index].x === utilizationRate;
                            if(isCurrentUR) { return `Current Rate: ${shortenNumber(data[index].y, 2)}%` }
                            return showLabels || isMax ? `${isMax && 'Max: '}${shortenNumber(data[index].y, 2)}%` : ''
                        }
                    }
                    style={{
                        data: { fillOpacity: 0.9, fill: 'url(#primary-gradient)', stroke: '#8881c9', strokeWidth: 1 },
                        labels: { fill: 'white', fontWeight: 'bold', fontFamily: 'Inter' }
                    }}
                    interpolation={interpolation}
                />
                <VictoryAxis label="Interest Rate" style={defaultYAxis} dependentAxis tickFormat={(t) => shortenNumber(t, 2) + '%'} />
                <VictoryAxis label="Utilization Rate" tickValues={xAxisTicks} style={defaultAxisStyle} tickFormat={(t) => shortenNumber(t, 2) + '%'} />
            </VictoryChart>
            }
        </Box >
    )
}