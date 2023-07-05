import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ComposedChart, ReferenceLine, ReferenceArea } from 'recharts';
import moment from 'moment';
import { preciseCommify } from '@app/util/misc';
import { useState } from 'react';
import { RSubmitButton } from '../common/Button/RSubmitButton';

const initialState = {
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: '',
    top: 'dataMax+1',
    bottom: 'dataMin-1',
    animation: true,
};

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
}) => {
    // console.log('combodata', combodata);
    const { themeStyles, themeName } = useAppTheme();
    const [state, setState] = useState({ ...initialState, data: combodata });
    const { data, left, right, refAreaLeft, refAreaRight, top, bottom } = state
    const [brushIndexes, setBrushIndexes] = useState({ startIndex: undefined, endIndex: undefined });

    const getAxisYDomain = (from, to, ref, offset) => {
        const xs = combodata.map(d => d.x);
        const fromIndex = xs.indexOf(from);
        const toIndex = xs.indexOf(to);
        const refData = combodata.slice(fromIndex - 1, toIndex);
        let [bottom, top] = [refData[0][ref], refData[0][ref]];
        refData.forEach((d) => {
            if (d[ref] > top) top = d[ref];
            if (d[ref] < bottom) bottom = d[ref];
        });

        return [(bottom | 0) - offset, (top | 0) + offset, refData];
    };

    const zoomOut = () => {
        setState({
            ...state,
            refAreaLeft: '',
            refAreaRight: '',
            left: 'dataMin',
            right: 'dataMax',
            top: 'auto',
            bottom: 'auto',
        });
    }

    const zoom = () => {
        let { refAreaLeft, refAreaRight } = state;

        if (refAreaLeft === refAreaRight || refAreaRight === '') {
            setState({
                ...state,
                refAreaLeft: '',
                refAreaRight: '',
            });
            return;
        }

        // xAxis domain
        if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

        // yAxis domain
        const [bottom, top] = getAxisYDomain(refAreaLeft, refAreaRight, 'y', 1);

        setState({
            ...state,
            // data: 
            refAreaLeft: '',
            refAreaRight: '',
            left: refAreaLeft,
            right: refAreaRight,
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
                allowZoom && left !== 'dataMin' && right !== 'dataMax'
                && <RSubmitButton onClick={zoomOut} opacity="0.9" zIndex="1" w='fit-content' top="0" right="0" position="absolute">
                    Zoom Out
                </RSubmitButton>
            }
            <ComposedChart
                width={chartWidth}
                height={chartHeight}
                data={combodata}
                margin={{
                    top: 20,
                    right: 0,
                    left: 0,
                    bottom: 20,
                }}
                onMouseDown={!allowZoom ? undefined : (e) => setState({ ...state, refAreaLeft: e.activeLabel })}
                onMouseMove={!allowZoom ? undefined : (e) => state.refAreaLeft && setState({ ...state, refAreaRight: e.activeLabel })}
                // // eslint-disable-next-line react/jsx-no-bind
                onMouseUp={!allowZoom ? undefined : zoom}
                onMouseLeave={!allowZoom ? undefined : zoom}
            >
                <CartesianGrid fill={themeStyles.colors.accentChartBgColor} stroke="#66666633" strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis
                    minTickGap={7}
                    interval="preserveStartEnd"
                    style={_axisStyle.tickLabels}
                    dataKey="x"
                    scale="time"
                    type={'number'}
                    allowDataOverflow={true}
                    // domain={['dataMin', 'dataMax']}
                    domain={[left, right]}                    
                    tickFormatter={(v) => {
                        return moment(v).format('MMM Do')
                    }}
                />
                <YAxis style={_axisStyle.tickLabels} tickFormatter={(v) => smartShortNumber(v, 2, useUsd)} />
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
                <Area syncId="main" syncMethod={'value'} strokeDasharray="4" opacity={1} strokeWidth={2} name={yLabel} type={interpolation} dataKey={'y'} stroke={mainColor} dot={false} fillOpacity={1} fill={`url(#${mainColor}-gradient)`} />
                {
                    showEvents && events.map(d => {
                        return <ReferenceLine
                            position="start"
                            isFront={true}
                            x={d.x}
                            stroke={d.eventColor || themeStyles.colors.error}
                            strokeWidth={`2px`}
                            label={!showEventsLabels ? undefined : {
                                value: d.eventPointLabel,
                                position: 'top',
                                fill: d.eventColor || themeStyles.colors.error,
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
