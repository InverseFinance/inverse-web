import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, ReferenceLine, Line } from 'recharts';
import moment from 'moment';
import { getExponentialMovingAvg, getMovingAvg, preciseCommify } from '@app/util/misc';
import { useRechartsZoom } from '@app/hooks/useRechartsZoom';

const CURRENT_YEAR = new Date().getFullYear().toString();

const avgFunctions = {
    'moving-avg': getMovingAvg,
    'ema': getExponentialMovingAvg,
}

const getAddDaysAvg = (evoData: any[], periods: number[], avgTypes) => {
    const ignoreFirst = evoData?.length > 0 ? evoData[0].y === 0 : true;
    const [period, ...remainingPeriods] = periods;
    const [_avgType, ...remainingAvgTypes] = (avgTypes || ['avg']);
    const avgType = _avgType || 'avg';
    const avgKeyName = `y${period}${avgType}`;
    const isSimpleAvg = !avgType || avgType === 'avg';
    const movingAvgs = isSimpleAvg ? [] : avgFunctions[avgType](evoData.map(s => s.y), period, (val: number) => val !== 0);
    const data = evoData.map((d, i) => {
        if (ignoreFirst && i === 0) return { ...d, [avgKeyName]: d.y }
        else if (ignoreFirst && i < period) {
            const nb = Math.min(i - 1, period - 1) + 1;
            const slice = evoData.slice(i + 1 - nb, i + 1);
            const yAvg = !isSimpleAvg ? movingAvgs[i] : slice.reduce((prev, curr) => prev + curr.y, 0) / slice.length;
            return {
                ...d, [avgKeyName]: yAvg,
            }
        }
        const nb = Math.min(i, period - 1) + 1;
        const slice = evoData.slice(i + 1 - nb, i + 1);
        const yAvg = !isSimpleAvg ? movingAvgs[i] : slice.reduce((prev, curr) => prev + curr.y, 0) / slice.length;
        return {
            ...d, [avgKeyName]: yAvg,
        }
    });
    if (remainingPeriods.length > 0) {
        return getAddDaysAvg(data, remainingPeriods, remainingAvgTypes)
    }
    return data;
}

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
    secondaryType = 'monotone',
    secondaryLabel = 'Price',
    secondaryColor,
    secondaryAsUsd = true,
    secondaryPrecision = 4,
    secondaryOpacity = 1,
    secondaryAsLeftAxis = false,
    yDomainAsInteger = false,
    addDayAvg = false,
    avgTypes,
    allowEscapeViewBox = true,
    avgDayNumbers,
    avgLineProps,
    lineItems,
    duplicateYAxis = false,
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
    secondaryColor?: string
    secondaryRef?: string
    secondaryType?: string
    secondaryLabel?: string
    secondaryAsUsd?: boolean
    secondaryAsLeftAxis?: boolean
    secondaryPrecision?: number
    secondaryOpacity?: number
    yDomainAsInteger?: boolean
    duplicateYAxis?: boolean
    addDayAvg?: boolean
    avgTypes?: ('avg' | 'moving-avg' | 'ema')[]
    allowEscapeViewBox?: boolean
    avgDayNumbers?: number[]
    avgLineProps?: any[]
    lineItems?: any[]
}) => {
    const _combodata = addDayAvg && avgDayNumbers?.length ? getAddDaysAvg(combodata, avgDayNumbers, avgTypes) : combodata;
    const { themeStyles } = useAppTheme();
    const { mouseDown, mouseUp, mouseMove, mouseLeave, bottom, top, rangeButtonsBarAbs, zoomReferenceArea, data: zoomedData } = useRechartsZoom({
        combodata: _combodata, rangesToInclude, forceStaticRangeBtns, defaultRange
    });

    const _data = zoomedData || _combodata;

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '13px', userSelect: 'none' },
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
        left: rightPadding / 2,
    }
    const doesDataSpansSeveralYears = combodata?.filter(d => d.utcDate.endsWith('01-01')).length > 1;
    const _yDomain = zoomedData ? [bottom, top] : yDomain || [bottom, top];
    const mainAxisId = secondaryAsLeftAxis ? 'right' : 'left';
    const secAxisId = secondaryAsLeftAxis ? 'left' : 'right';

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
                <YAxis domain={_yDomain} yAxisId={mainAxisId} orientation={mainAxisId} style={_axisStyle.tickLabels} tickFormatter={(v) => v === 0 ? '' : isPerc ? `${smartShortNumber(v, 2)}%` : yDomainAsInteger ? smartShortNumber(v, 0, useUsd) : smartShortNumber(v, 2, useUsd)} />
                {
                    duplicateYAxis && chartWidth >= 400 && <YAxis domain={_yDomain} yAxisId="right" orientation="right" style={_axisStyle.tickLabels} tickFormatter={(v) => v === 0 ? '' : isPerc ? `${smartShortNumber(v, 2)}%` : yDomainAsInteger ? smartShortNumber(v, 0, useUsd) : smartShortNumber(v, 2, useUsd)} />
                }
                {
                    showSecondary && <YAxis allowDataOverflow={true} style={_axisStyle.tickLabels} yAxisId={secAxisId} orientation={secAxisId} tickFormatter={(v) => shortenNumber(v, secondaryPrecision, secondaryAsUsd)} />
                }
                {
                    showSecondary && !!secondaryRef && <Line isAnimationActive={false} opacity={secondaryOpacity} strokeWidth={2} name={secondaryLabel} yAxisId={secAxisId} type={secondaryType} dataKey={secondaryRef} stroke={secondaryColor || themeStyles.colors.info} dot={false} />
                }
                {
                    lineItems?.map(lineItem => {
                        return <Line key={`line-${lineItem.dataKey}`} isAnimationActive={false} opacity={lineItem.opacity ?? 1} strokeWidth={lineItem.strokeWidth || 2} name={lineItem.name || secondaryLabel} yAxisId={lineItem.axisId || 'left'} type={lineItem.type || 'monotone'} dataKey={lineItem.dataKey} stroke={lineItem.stroke || themeStyles.colors.info} dot={lineItem.dot || false} />
                    })
                }
                {
                    showTooltips && <Tooltip
                        wrapperStyle={{ ..._axisStyle.tickLabels, zIndex: 1 }}
                        contentStyle={{ backgroundColor: themeStyles.colors.mainBackgroundColor }}
                        labelFormatter={v => moment(v).format('MMM Do YYYY')}
                        labelStyle={{ fontWeight: 'bold', color: themeStyles.colors.mainTextColor }}
                        itemStyle={{ fontWeight: 'bold' }}
                        allowEscapeViewBox={allowEscapeViewBox ? { x: true, y: true } : undefined}
                        formatter={(value, name) => {
                            const isPrice = /price/i.test(name);
                            const isSecondary = name === secondaryLabel;
                            return !value ? 'none' : !isPrice && isPerc ? `${shortenNumber(value, 2)}%` : isPrice ? shortenNumber(value, 4, true) : preciseCommify(value, value < 1 ? 4 : 0, isSecondary ? secondaryAsUsd : useUsd)
                        }}
                    />
                }
                {
                    showLegend && <Legend wrapperStyle={legendStyle} style={{ cursor: 'pointer' }} formatter={(value) => value} />
                }
                <Area syncId="main" yAxisId={mainAxisId} syncMethod={'value'} opacity={1} strokeWidth={2} name={yLabel} type={interpolation} dataKey={'y'} stroke={strokeColor || themeStyles.colors[mainColor]} dot={false} fillOpacity={1} fill={`url(#${mainColor}-gradient)`} />
                {
                    addDayAvg && avgDayNumbers?.map((period, periodIndex) => {
                        const _avgLineProps = avgLineProps ? avgLineProps[periodIndex] : {};
                        const avgType = avgTypes ? avgTypes[periodIndex] : 'avg';
                        return <Line key={period + '-' + avgType} isAnimationActive={false} opacity={1} strokeWidth={2} name={`${period}-day ${avgType.replace('-', ' ').replace('ema', 'EMA')}`} yAxisId={mainAxisId} type="monotone" dataKey={'y' + period + avgType} stroke={themeStyles.colors.info} dot={false} {..._avgLineProps} />
                    })
                }
                {
                    showEvents && events.map(d => {
                        return <ReferenceLine
                            key={`x-${d.x}`}
                            yAxisId={mainAxisId}
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
                            key={`x-${d.x}`}
                            yAxisId={mainAxisId}
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
