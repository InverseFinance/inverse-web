import { shortenNumber } from '@inverse/util/markets';
import { VictoryChart, VictoryLabel, VictoryAxis, VictoryArea, VictoryTheme, VictoryClipContainer, VictoryTooltip, VictoryVoronoiContainer, VictoryAreaProps } from 'victory';
import moment from 'moment'
import { Box } from '@chakra-ui/react';

type Props = { x: number, y: number }[]

export const AreaChart = ({
    data,
    title,
    width = 1000,
    height = 300,
    showLabels = false,
    showTooltips = false,
    interpolation = 'basis',
}: {
    data: Props,
    title?: string,
    width?: number,
    height?: number,
    showLabels?: boolean,
    showTooltips?: boolean,
    interpolation?: VictoryAreaProps["interpolation"],
}) => {
    const maxY = data.length > 0 ? Math.max(...data.map(d => d.y)) : 95000000;
    const tickCount = Math.floor(width / 120)
    return (
        <Box
            width={width}
            height={height}
            position="relative"
        >
            <VictoryChart
                width={width}
                height={height}
                theme={VictoryTheme.material}
                animate={{ duration: 500 }}
                containerComponent={!showTooltips ? undefined :
                    <VictoryVoronoiContainer
                        mouseFollowTooltips={true}
                        voronoiDimension="x"
                        labelComponent={<VictoryTooltip centerOffset={{ x: -50 }} cornerRadius={0} flyoutStyle={{ fill: "white" }} />}
                        labels={({ datum }) => {
                            return (
                                moment(datum.x).format('MMM Do YYYY') + '\n' + shortenNumber(datum.y, 1)
                            )
                        }}
                    />
                }
            >
                {
                    !!title && <VictoryLabel text={title} style={{ fill: 'white' }} x={Math.floor(width / 2)} y={30} textAnchor="middle" />
                }
                <VictoryAxis style={{ tickLabels: { fill: '#fff' }, grid: { stroke: 'grey' } }} dependentAxis tickFormat={(t) => shortenNumber(t, 1)} />
                <VictoryAxis style={{ tickLabels: { fill: '#fff' }, grid: { stroke: 'grey' } }} tickCount={tickCount} tickFormat={(t) => moment(t).format('MMM Do YYYY')} />
                <VictoryArea
                    domain={{ y: [0, maxY + 5000000] }}
                    groupComponent={<VictoryClipContainer clipId="area-chart" />}
                    data={data}
                    labels={showLabels ? ({ data, index }) => shortenNumber(data[index].y, 1) : undefined}
                    style={{
                        data: { fillOpacity: 0.9, fill: 'url(#primary-gradient)', stroke: '#8881c9', strokeWidth: 1 },
                    }}
                    interpolation={interpolation}
                />
            </VictoryChart>
        </Box >
    )
}