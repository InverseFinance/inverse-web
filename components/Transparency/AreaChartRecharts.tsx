import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, ReferenceLine, Line } from 'recharts';
import moment from 'moment';
import { preciseCommify } from '@app/util/misc';
import { useRechartsZoom } from '@app/hooks/useRechartsZoom';

const CURRENT_YEAR = new Date().getFullYear().toString();

export const AreaChartRecharts = ({
    combodata,
    title,
    chartWidth = 900,
    chartHeight = 300,
    axisStyle,
    useUsd = false,
    mainColor,
    interpolation,
    yDomain,
    yLabel,
    showTooltips = true,
    showLegend = false,
    legendPosition = 'top',
    allowZoom = false,
    showEvents = false,
    showEventsLabels = false,
    events,
    rightPadding = 0,
    minTickGap = 14,
    interval = 'preserveEnd',
    showRangeBtns = false,
    rangesToInclude,
    defaultRange,
    strokeColor,
    isPerc,
    forceStaticRangeBtns,
    showSecondary = false,
    secondaryRef = 'price',
    secondaryLabel = 'Price',
    secondaryAsUsd = true,
    secondaryPrecision = 4,
}: {
    combodata: { y: number, x: number, timestamp: number, utcDate: string }[]
    title: string
    axisStyle?: any
    chartWidth?: number
    chartHeight?: number
    useUsd?: boolean
    showLegend?: boolean
    legendPosition?: 'top' | 'bottom'
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
    minTickGap?: number
    interval?: string | number
    showRangeBtns?: boolean
    rangesToInclude?: string[]
    defaultRange?: string
    strokeColor?: string
    isPerc?: boolean
    forceStaticRangeBtns?: boolean
    showSecondary?: boolean
    secondaryRef?: string
    secondaryLabel?: string
    secondaryAsUsd?: boolean
    secondaryPrecision?: number
}) => {    
    const { themeStyles } = useAppTheme();
    const { mouseDown, mouseUp, mouseMove, mouseLeave, bottom, top, rangeButtonsBarAbs, zoomReferenceArea, data } = useRechartsZoom({
        combodata, rangesToInclude, forceStaticRangeBtns, defaultRange    
    });

    const _data = data || combodata;

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '14px', userSelect: 'none' },
        grid: {
            stroke: '#66666633',
            strokeDasharray: '4 4',
        }
    }

    const legendStyle = {
        ..._axisStyle.tickLabels,
        verticalAlign: legendPosition,
        top: legendPosition === 'top' ? -8 : undefined,
        fontSize: '12px',
    }    
    const doesDataSpansSeveralYears = combodata?.filter(d => d.utcDate.endsWith('01-01')).length > 1;

    return (
        <VStack position="relative" alignItems="center" maxW={`${chartWidth}px`}>
            <Text fontWeight="bold">
                {title}
            </Text>
            {
                showRangeBtns && rangeButtonsBarAbs
            }
            <ComposedChart
                width={chartWidth}
                height={chartHeight}
                data={_data}
                margin={{
                    top: 20,
                    right: rightPadding,
                    left: 0,
                    bottom: 20,
                }}
                onMouseDown={!allowZoom ? undefined : (e) => mouseDown(e)}
                onMouseMove={!allowZoom ? undefined : mouseMove}
                // // eslint-disable-next-line react/jsx-no-bind
                onMouseUp={!allowZoom ? undefined : () => mouseUp()}
                onMouseLeave={!allowZoom ? undefined : mouseLeave}
            >
                <CartesianGrid fill={themeStyles.colors.accentChartBgColor} stroke="#66666633" strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis
                    minTickGap={minTickGap}
                    interval={interval}
                    style={_axisStyle.tickLabels}
                    dataKey="x"
                    scale="time"
                    type={'number'}
                    allowDataOverflow={true}
                    domain={['dataMin', 'dataMax']}
                    // domain={[left, right]}`  
                    tickFormatter={(v, i) => {
                        return moment(v).format('MMM Do')
                    }}
                />
                <YAxis domain={[bottom, top]} yAxisId="left" style={_axisStyle.tickLabels} tickFormatter={(v) => v === 0 ? '' : isPerc ? `${smartShortNumber(v, 2)}%` : smartShortNumber(v, 2, useUsd)} />
                {
                    showSecondary && <YAxis allowDataOverflow={true} style={_axisStyle.tickLabels} yAxisId="right" orientation="right" tickFormatter={(v) => shortenNumber(v, secondaryPrecision, secondaryAsUsd)} />
                }
                {
                    showSecondary && <Line isAnimationActive={false} opacity={1} strokeWidth={2} name={secondaryLabel} yAxisId="right" type="monotone" dataKey={secondaryRef} stroke={themeStyles.colors.info} dot={false} />
                }
                {
                    showTooltips && <Tooltip
                        wrapperStyle={_axisStyle.tickLabels}
                        contentStyle={{ backgroundColor: themeStyles.colors.mainBackgroundColor }}
                        labelFormatter={v => moment(v).format('MMM Do YYYY')}
                        labelStyle={{ fontWeight: 'bold', color: themeStyles.colors.mainTextColor }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value, name) => {
                            const isPrice = name === 'Price';
                            const isSecondary = name === secondaryLabel;
                            return !value ? 'none' : isPerc ? `${shortenNumber(value, 2)}%` : isPrice ? shortenNumber(value, 4, true) : preciseCommify(value, 0, isSecondary ? secondaryAsUsd : useUsd)
                        }}
                    />
                }
                {
                    showLegend && <Legend wrapperStyle={legendStyle} style={{ cursor: 'pointer' }} formatter={(value) => value} />
                }
                <Area syncId="main" yAxisId="left" syncMethod={'value'} opacity={1} strokeWidth={2} name={yLabel} type={interpolation} dataKey={'y'} stroke={strokeColor||themeStyles.colors[mainColor]} dot={false} fillOpacity={1} fill={`url(#${mainColor}-gradient)`} />
                {
                    showEvents && events.map(d => {
                        return <ReferenceLine
                            yAxisId="left"
                            position="start"
                            isFront={true}
                            x={d.x}
                            stroke={d.eventColor || themeStyles.colors.error}
                            strokeWidth={`2px`}
                            label={!showEventsLabels || chartWidth < 400 ? undefined : {
                                value: d.eventPointLabel,
                                position: 'top',
                                fill: d.eventColor || themeStyles.colors.error,
                                style: { fontSize: '14px', fontWeight: 'bold', userSelect: 'none' },
                            }}
                        />
                    })
                }
                {
                    combodata.filter(d => d.utcDate.endsWith('01-01')).map(d => {
                        return <ReferenceLine
                            yAxisId="left"
                            position="start"
                            isFront={true}
                            x={d.x}
                            stroke={themeStyles.colors.mainTextColor}
                            strokeWidth={`1`}
                            strokeDasharray={'4 4'}
                            label={{
                                value: d.utcDate.substring(0, 4),
                                position: d.utcDate.substring(0, 4) === CURRENT_YEAR && doesDataSpansSeveralYears ? 'insideRight' : 'insideLeft',
                                fill: themeStyles.colors.mainTextColor,
                                style: { fontSize: '14px', fontWeight: 'bold', userSelect: 'none' },
                            }}
                        />
                    })
                }
                {zoomReferenceArea}
            </ComposedChart>
        </VStack>
    );
}
