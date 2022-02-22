import { shortenNumber } from '@app/util/markets';
import { VictoryChart, VictoryLabel, VictoryAxis, VictoryPie, VictoryTheme, VictoryTooltip } from 'victory';
import { Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';

type Props = { x: string, y: number }[]

const defaultGraphicData = [{ y: 100 }]; // Data used to make the animate prop work

class CustomLabel extends React.Component {
    render() {
        const { datum } = this.props;
        return (
            <g>
                <VictoryLabel {...this.props} />
                <VictoryTooltip
                    {...this.props}
                    flyoutWidth={200}
                    labelComponent={<VictoryLabel text={`${datum.x}: ${shortenNumber(datum.y, 2, true)} (${shortenNumber(datum.perc, 2)}%)`} />}
                    flyoutStyle={{ fill: "#8881c9" }}
                    flyoutPadding={10}
                />
            </g>
        );
    }
}

CustomLabel.defaultEvents = VictoryTooltip.defaultEvents;

export const PieChart = ({
    data,
    width = 250,
    height = 250,
}: {
    data: Props,
    width?: number,
    height?: number,
}) => {
    const [chartData, setChartData] = useState(defaultGraphicData);

    useDebouncedEffect(() => {
        const _data = data.length === 1 && data[0].y === 0 ? [{ ...data[0], y: 1e-18 }] : data;
        setChartData(_data);
    }, [data], 500)

    return (
        <Box
            width={width}
            height={height}
            position="relative"
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
                    padding={{ left: 100, right: 100, top: 50, bottom: 50 }}
                    theme={VictoryTheme.material}
                    data={chartData}
                    labelComponent={<CustomLabel />}
                    padAngle={20}
                    innerRadius={30}
                    style={{
                        data: {
                            fillOpacity: 0.9, stroke: "#fff", strokeWidth: 1
                        },
                        labels: {
                            fontSize: 12, fill: "#fff"
                        }
                    }}
                />
            </VictoryChart>
        </Box >
    )
}