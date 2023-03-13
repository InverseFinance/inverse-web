import { shortenNumber } from '@app/util/markets';
import { VictoryChart, VictoryLabel, VictoryAxis, VictoryPie, VictoryTheme, VictoryTooltip } from 'victory';
import { Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';
import { useAppTheme } from '@app/hooks/useAppTheme';

type Props = { x: string, y: number, perc?: number }[]

const defaultGraphicData = [{ x: 'Loading...', y: 100 }]; // Data used to make the animate prop work
class CustomLabel extends React.Component {
    render() {
        const { datum, showAsAmountOnly, themeStyles } = this.props;    
        return (
            <g>
                <VictoryLabel {...this.props} />
                <VictoryTooltip
                    {...this.props}
                    pointerLength={20}
                    pointerWidth={20}
                    flyoutWidth={250}
                    labelComponent={<VictoryLabel
                        style={{ fontSize: '14px', fill: '#fff', fontFamily: 'Inter', fontWeight: 'bold' }}
                        text={[
                            `${datum.x}`,
                            ' ',
                            `${shortenNumber(datum.y, 2, !showAsAmountOnly)} (${shortenNumber(datum.perc, 2)}%)`,
                        ]}
                    />}
                    flyoutStyle={{ fill: themeStyles.colors.darkPrimary, stroke: '#fff' }}
                    flyoutPadding={10}
                    flyoutHeight={80}
                />
            </g>
        );
    }
}

CustomLabel.defaultEvents = VictoryTooltip.defaultEvents;

const defaultPadding = { left: 100, right: 100, top: 50, bottom: 50 };

export const PieChart = ({
    data,
    width = 250,
    height = 250,
    padding = defaultPadding,
    colorScale,
    handleDrill,
    showTotalUsd = false,
    showAsAmountOnly = false,
    innerRadius,
}: {
    data: Props,
    width?: number,
    height?: number,
    padding?: { left?: number, right?: number, top?: number, bottom?: number },
    colorScale?: string[],
    handleDrill?: (datum: any) => void,
    showTotalUsd?: boolean,
    showAsAmountOnly?: boolean,
    innerRadius?: number,
}) => {
    const [chartData, setChartData] = useState(defaultGraphicData);
    const { themeStyles, themeParams } = useAppTheme();
    const { CHART_COLORS } = themeParams;
    const _colorScale = colorScale || CHART_COLORS;

    useDebouncedEffect(() => {
        const _data = data.length === 1 && data[0].y === 0 ? [{ ...data[0], y: 1e-18 }] : data;
        setChartData(_data);
    }, [data], 500)

    const total = data.reduce((prev, curr) => prev + curr.y, 0);

    return (
        <Box
            width={width}
            height={height}
            position="relative"
            className="svg-overflow-visible"
        >
            <VictoryChart
                theme={VictoryTheme.material}
                animate={{ duration: 500 }}
                width={width}
                height={height}
            >
                <VictoryAxis style={{
                    axis: { stroke: "transparent", fill: "transparent" },
                    ticks: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: {
                        stroke: 'transparent',
                    }
                }} />
                <VictoryAxis dependentAxis style={{
                    axis: { stroke: "transparent", fill: "transparent" },
                    ticks: { stroke: "transparent" },
                    tickLabels: { fill: "transparent" },
                    grid: {
                        stroke: 'transparent',
                    }
                }} />
                <VictoryPie
                    padding={{ ...defaultPadding, ...padding }}
                    theme={VictoryTheme.material}
                    data={chartData}
                    labelComponent={<CustomLabel themeStyles={themeStyles} showAsAmountOnly={showAsAmountOnly} />}
                    padAngle={20}
                    innerRadius={innerRadius ?? 35}
                    colorScale={_colorScale}
                    events={[
                        {
                            target: "data",
                            eventHandlers: {
                                onClick: (a, b) => {
                                    if (handleDrill) { handleDrill(b.datum) }
                                },
                                onMouseOver: (e, b) => {
                                    return [
                                        {
                                            target: "data",
                                            mutation: !handleDrill || !b?.datum?.fund?.drill ?
                                                () => { }
                                                :
                                                (opt) => {
                                                    return ({
                                                        style: { ...opt.style, fill: themeStyles.colors.secondary }
                                                    })
                                                }
                                        },
                                        {
                                            target: "labels",
                                            mutation: () => ({ active: true })
                                        },
                                    ];
                                },
                                onMouseOut: () => {
                                    return [
                                        {
                                            target: "data",
                                            mutation: () => { }
                                        },
                                        {
                                            target: "labels",
                                            mutation: () => ({ active: false })
                                        },
                                    ];
                                }
                            },
                        },
                        {
                            target: "labels",
                            eventHandlers: {
                                onClick: (a, b) => {
                                    if (handleDrill) { handleDrill(b.datum) }
                                },
                                onMouseOver: (e, b) => {
                                    return [
                                        {
                                            target: "data",
                                            mutation: !handleDrill || !b?.datum?.fund?.drill ?
                                                () => { }
                                                :
                                                (opt) => {
                                                    return ({
                                                        style: { ...opt.style, fill: themeStyles.colors.secondary }
                                                    })
                                                }
                                        },
                                        {
                                            target: "labels",
                                            mutation: !handleDrill || !b?.datum?.fund?.drill ?
                                                () => { }
                                                :
                                                (opt) => {
                                                    return ({
                                                        style: { ...opt.style, fill: themeStyles.colors.secondary }
                                                    })
                                                }
                                        },
                                    ];
                                },
                                onMouseOut: () => {
                                    return [
                                        {
                                            target: "data",
                                            mutation: () => { }
                                        },
                                        {
                                            target: "labels",
                                            mutation: () => { }
                                        },
                                    ];
                                }
                            },
                        },
                    ]}
                    style={{
                        data: {
                            fillOpacity: 0.9,
                            stroke: themeStyles.colors.mainTextColor,
                            strokeWidth: 1,
                            cursor: ({ datum }) => datum.fund?.drill ? 'pointer' : 'normal',
                            fill: ({ datum }) => datum.fill || _colorScale[datum._x - 1],
                        },
                        labels: {
                            fontSize: 12,
                            fill: ({ datum }) => datum.labelFill || themeStyles.colors.mainTextColor,
                            cursor: (p) => p.datum.fund?.drill ? 'pointer' : 'normal',
                        },
                    }}
                />
                {
                    showTotalUsd && <text
                        fill={themeStyles.colors.mainTextColor}
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x="50%"
                        y="50%"
                        fontSize="12px"
                    >
                        {shortenNumber(total, 2, !showAsAmountOnly)}
                    </text>
                }
            </VictoryChart>
        </Box >
    )
}