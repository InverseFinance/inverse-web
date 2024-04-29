import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart } from 'recharts';
import { preciseCommify } from '@app/util/misc';

const CustomizedLabel = ({x, y, fill, value, color, useUsd, precision = 2 }) => {
    return <text
        x={x}
        y={y}
        dx={13}
        dy={-8}
        fontSize='14'
        fontFamily='sans-serif'
        fontWeight="bold" 
        fill={color}
        textAnchor="middle">{value ? smartShortNumber(value, precision, useUsd): ''}</text>
};

export const BarChartRecharts = ({
    combodata,
    title,
    chartWidth = 900,
    chartHeight = 300,
    axisStyle,
    useUsd = false,
    mainColor,
    yDomain,
    yLabel,
    showTooltips = true,
    showLegend = false,
    allowZoom = false,
    rightPadding = 0,
    showLabel = true,
    precision = 2,
}: {
    combodata: { y: number, x: number, timestamp: number, utcDate: string }[]
    title: string
    axisStyle?: any
    chartWidth?: number
    chartHeight?: number
    useUsd?: boolean
    showLegend?: boolean
    showTooltips?: boolean
    allowZoom?: boolean
    mainColor?: string
    interpolation?: string
    yLabel?: string
    yDomain?: [any, any]
    showEvents?: boolean
    showEventsLabels?: boolean
    events?: any[]
    rightPadding?: number
    showLabel?: boolean
    precision?: number
}) => {
    const { themeStyles } = useAppTheme();

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '14px', userSelect: 'none' },
        grid: {
            stroke: '#66666633',
            strokeDasharray: '4 4',
        }
    }

    const legendStyle = {
        ..._axisStyle.tickLabels,
        top: -8,
        fontSize: '12px',
    }

    const defaultColor = themeStyles.colors.success;
    const color = mainColor || defaultColor;    

    return (
        <VStack position="relative" alignItems="center" maxW={`${chartWidth}px`}>
            {
                !!title && <Text fontWeight="bold">
                    {title}
                </Text>
            }
            <ComposedChart
                width={chartWidth}
                height={chartHeight}
                data={combodata}
                margin={{
                    top: 20,
                    right: rightPadding,
                    left: 0,
                    bottom: 20,
                }}
            >
                <CartesianGrid fill={themeStyles.colors.accentChartBgColor} stroke="#66666633" strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis
                    style={_axisStyle.tickLabels}
                    dataKey="x"
                />
                <YAxis style={_axisStyle.tickLabels} tickFormatter={(v) => v === 0 ? '' : smartShortNumber(v, 2, useUsd)} />
                {
                    showTooltips && <Tooltip
                        wrapperStyle={_axisStyle.tickLabels}
                        contentStyle={{ backgroundColor: themeStyles.colors.mainBackgroundColor }}
                        labelFormatter={v => v}
                        labelStyle={{ fontWeight: 'bold' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value, name) => {
                            const isPrice = name === 'Price';
                            return !value ? 'none' : isPrice ? shortenNumber(value, 4, useUsd) : preciseCommify(value, 0, useUsd)
                        }}
                    />
                }
                {
                    showLegend && <Legend wrapperStyle={legendStyle} style={{ cursor: 'pointer' }} formatter={(value) => value} />
                }
                <Bar label={showLabel ? (props) => <CustomizedLabel {...props} useUsd={useUsd} color={color} precision={precision} /> : undefined} maxBarSize={25} name={yLabel} dataKey={'y'} stroke={color} fillOpacity={1} fill={color} />
            </ComposedChart>
        </VStack>
    );
}
