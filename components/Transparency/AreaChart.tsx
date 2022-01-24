import { shortenNumber } from '@inverse/util/markets';
import { VictoryChart, VictoryAxis, VictoryArea, VictoryTheme, VictoryClipContainer } from 'victory';
import moment from 'moment'
import { Box } from '@chakra-ui/react';

type Props = { x: number, y: number }[]

export const AreaChart = ({
    data,
    width = 1000,
    height = 300,
}: {
    data: Props,
    width?: number,
    height?: number,
}) => {
    const tickCount = Math.floor(width / 120)
    return (
        <Box
            width={width}
            height={height}>
            <VictoryChart
                width={width}
                height={height}
                theme={VictoryTheme.material}
                animate={{ duration: 500 }}
            >
                <VictoryAxis style={{ tickLabels: { fill: '#fff' } }} dependentAxis tickFormat={(t) => shortenNumber(t, 1)} />
                <VictoryAxis style={{ tickLabels: { fill: '#fff' } }} tickCount={tickCount} tickFormat={(t) => moment(t * 1000).format('MMM Do YYYY')} />
                <VictoryArea
                    groupComponent={<VictoryClipContainer clipId="area-chart" />}
                    padding={{ top: 20, bottom: 60 }}
                    colorScale="blue"
                    data={data}
                    style={{ data: { fillOpacity: 0.9, fill: 'url(#primary-gradient)', stroke: '#8881c9', strokeWidth: 1 } }}
                    interpolation={"basis"}
                />
            </VictoryChart>
        </Box>
    )
}