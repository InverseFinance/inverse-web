import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text, HStack } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ComposedChart, ReferenceLine, ReferenceArea } from 'recharts';
import moment from 'moment';
import { preciseCommify, timestampToUTC } from '@app/util/misc';
import { useState } from 'react';
import { RSubmitButton } from '../common/Button/RSubmitButton';
import { ONE_DAY_MS } from '@app/config/constants';

const initialState = {
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: '',
    top: 'auto',
    bottom: 'auto',
    animation: true,
};

const rangeBtns = [
    { label: 'All' },
    { label: '1Y' },
    { label: '6M' },
    { label: '3M' },
    { label: 'YTD' },
]

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
    allowZoom = false,
    showEvents = false,
    showEventsLabels = false,
    events,
    rightPadding = 0,
    minTickGap = 14,
    interval = 'preserveEnd',
    showRangeBtns = false,
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
    minTickGap?: number
    interval?: string | number
    showRangeBtns?: boolean
}) => {
    const { themeStyles } = useAppTheme();
    const [state, setState] = useState({ ...initialState, data: null });
    const [refAreaLeft, setRefAreaLeft] = useState(initialState.refAreaLeft);
    const [refAreaRight, setRefAreaRight] = useState(initialState.refAreaRight);
    const [lastRangeType, setLastRangeType] = useState(rangeBtns[0].label);
    const { data, left, right, top, bottom } = state
    const _data = data || combodata;
    const [brushIndexes, setBrushIndexes] = useState({ startIndex: undefined, endIndex: undefined });

    const getAxisYDomain = (from, to, ref, offsetPerc = 0.05) => {
        const xs = combodata.map(d => d.x);
        const fromIndex = Math.max(xs.indexOf(from), 0);
        const toIndex = xs.indexOf(to) === -1 ? xs.length - 1 : xs.indexOf(to);
        const refData = combodata.slice(fromIndex, toIndex + 1);
        let [bottom, top] = [refData[0][ref], refData[0][ref]];
        refData.forEach((d) => {
            if (d[ref] > top) top = d[ref];
            if (d[ref] < bottom) bottom = d[ref];
        });

        return [Math.max((bottom || 0) * (1 - offsetPerc), 0), (top | 0) * (1 + offsetPerc), refData];
    };

    const zoomOut = () => {
        setRefAreaLeft('');
        setRefAreaRight('');
        setLastRangeType(rangeBtns[0].label);
        setState({
            ...state,
            data: null,
            left: 'dataMin',
            right: 'dataMax',
            top: 'auto',
            bottom: 'auto',
        });
    }

    const mouseLeave = () => {
        zoom();
        setRefAreaLeft('');
        setRefAreaRight('');
    }

    const mouseMove = (e) => {
        refAreaLeft && !!e && setRefAreaRight(e.activeLabel);
    }

    const changeToRange = (rangeType: string) => {
        setLastRangeType(rangeType);
        if (rangeType === 'All') {
            zoomOut();
            return;
        } else {
            const nowUtc = timestampToUTC(Date.now());
            const utcYear = nowUtc.substring(0, 4);
            let left;
            const right = combodata[combodata.length - 1].x;
            if (rangeType === 'YTD') {
                left = combodata.find(d => d.utcDate.startsWith(utcYear)).x;             
            } else if (rangeType === '1Y') {
                left = combodata.find(d => d.x >= (right-ONE_DAY_MS * 366)).x;
            } else if (rangeType === '6M') {
                left = combodata.find(d => d.x >= (right-ONE_DAY_MS * 181)).x;
            } else if (rangeType === '3M') {
                left = combodata.find(d => d.x >= (right-ONE_DAY_MS * 91)).x;
            }            
            zoom(left, right);
        }
    }

    const mouseDown = (e) => {
        setLastRangeType('');
        return !!e && setRefAreaLeft(e.activeLabel);
    }

    const mouseUp = () => {        
        zoom();
    }

    const zoom = (l?: string | number, r?: string | number) => {
        const refLeft = l || refAreaLeft;
        const refRight = r || refAreaRight;

        if (refLeft === refRight || refRight === '') {
            setRefAreaLeft('');
            setRefAreaRight('');
            return;
        }

        // xAxis domain
        if (refLeft > refRight) [refLeft, refRight] = [refRight, refLeft];

        // yAxis domain
        const [bottom, top, data] = getAxisYDomain(refLeft, refRight, 'y', 0.02);

        setRefAreaLeft('');
        setRefAreaRight('');
        setState({
            ...state,
            data,
            left: refLeft,
            right: refRight,
            bottom,
            top,
        });
    }

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

    const handleBrush = (params) => {
        setBrushIndexes(params);
    }

    return (
        <VStack position="relative" alignItems="center" maxW={`${chartWidth}px`}>
            <Text fontWeight="bold">
                {title}
            </Text>
            {
                showRangeBtns && <HStack position={{ base: 'static', md: 'absolute' }} top="-43px">
                    {rangeBtns.map((btn, i) => <RSubmitButton bgColor={btn.label === lastRangeType ? 'accentTextColor' : undefined} onClick={() => changeToRange(btn.label)} maxH="30px" py="1" px="2" fontSize="12px">{btn.label}</RSubmitButton>)}
                </HStack>
            }
            {
                allowZoom && left !== 'dataMin' && right !== 'dataMax'
                && <RSubmitButton onClick={zoomOut} opacity="0.9" zIndex="1" w='fit-content' top={{ base: '35px', md: '0' }} right="0" position="absolute">
                    Zoom Out
                </RSubmitButton>
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
                <YAxis domain={[bottom, top]} style={_axisStyle.tickLabels} tickFormatter={(v) => v === 0 ? '' : smartShortNumber(v, 2, useUsd)} />
                {
                    showTooltips && <Tooltip
                        wrapperStyle={_axisStyle.tickLabels}
                        contentStyle={{ backgroundColor: themeStyles.colors.mainBackgroundColor }}
                        labelFormatter={v => moment(v).format('MMM Do YYYY')}
                        labelStyle={{ fontWeight: 'bold' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value, name) => {
                            const isPrice = name === 'Price';
                            return !value ? 'none' : isPrice ? shortenNumber(value, 4, true) : preciseCommify(value, 0, useUsd)
                        }}
                    />
                }
                {
                    showLegend && <Legend wrapperStyle={legendStyle} style={{ cursor: 'pointer' }} formatter={(value) => value} />
                }
                <Area syncId="main" syncMethod={'value'} opacity={1} strokeWidth={2} name={yLabel} type={interpolation} dataKey={'y'} stroke={themeStyles.colors[mainColor]} dot={false} fillOpacity={1} fill={`url(#${mainColor}-gradient)`} />
                {
                    showEvents && events.map(d => {
                        return <ReferenceLine
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
                            position="start"
                            isFront={true}
                            x={d.x}
                            stroke={themeStyles.colors.mainTextColor}
                            strokeWidth={`1`}
                            strokeDasharray={'4 4'}
                            label={{
                                value: d.utcDate.substring(0, 4),
                                position: 'insideLeft',
                                fill: themeStyles.colors.mainTextColor,
                                style: { fontSize: '14px', fontWeight: 'bold', userSelect: 'none' },
                            }}
                        />
                    })
                }
                {allowZoom && refAreaLeft && refAreaRight ? (
                    <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} />
                ) : null}
                {/* {
                    allowZoom && <Brush syncId="main" syncMethod={'value'} onChange={handleBrush} startIndex={brushIndexes.startIndex} endIndex={brushIndexes.endIndex} data={combodata} dataKey="x" height={30} stroke="#8884d8" tickFormatter={(v) => ''} />
                } */}
            </ComposedChart>
        </VStack>
    );
}
