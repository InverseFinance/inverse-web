import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { smartShortNumber } from '@app/util/markets';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart } from 'recharts';
import moment from 'moment';
import { preciseCommify } from '@app/util/misc';
import { useEffect, useMemo, useState } from 'react';
import { useRechartsZoom } from '@app/hooks/useRechartsZoom';

const KEYS = {
    INFLATION: 'Inflation',
}

const gradientOffset = (data: any) => {
    const dataMax = Math.max(...data.map((i: any) => i.inflation));
    const dataMin = Math.min(...data.map((i: any) => i.inflation));

    if (dataMax <= 0) {
        return 0;
    }
    if (dataMin >= 0) {
        return 1;
    }

    return dataMax / (dataMax - dataMin);
};


export const DbrInflationChart = ({
    combodata,
    chartWidth = 900,
    axisStyle,
    useUsd = false,
}: {
    combodata: { inflation: number, timestamp: number }[]
    axisStyle?: any
    chartWidth?: number
    useUsd?: boolean
}) => {
    const { themeStyles, themeName } = useAppTheme();
    const [leftYDomain, setLeftYDomain] = useState(['dataMin', 'dataMax']);

    const { mouseDown, mouseUp, mouseMove, mouseLeave, zoomOutButton, rangeButtonsBar, zoomReferenceArea, data } = useRechartsZoom({
        combodata, xKey: 'timestamp', yKey: useUsd ? 'inflationUsd' : 'inflation', yAxisId: 'left',
        rangesToInclude: ['All', '6M', '3M', '1M', '1W', 'YTD'],
    });
    const _data = data || combodata;

    const [actives, setActives] = useState({
        [KEYS.INFLATION]: true,
    });

    const off = useMemo(() => gradientOffset(_data), [_data]);

    useEffect(() => {
        if (!combodata?.length) {
            return;
        }
        const suffix = useUsd ? 'Usd' : '';
        const keys = ([actives[KEYS.INFLATION] ? 'inflation' + suffix : ''])
            .filter(d => !!d);

        const dataMin = Math.min(...combodata.map(d => Math.min(...keys.map(k => (d[k] || 0)))));
        const dataMax = Math.max(...combodata.map(d => Math.max(...keys.map(k => (d[k] || 0)))));
        setLeftYDomain([dataMin, Math.ceil(dataMax * 1.05)]);
    }, [actives, combodata, useUsd]);

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '14px', userSelect: 'none' },
        grid: {
            stroke: '#66666633',
            strokeDasharray: '4 4',
        }
    }

    const legendStyle = {
        ..._axisStyle.tickLabels,
        fontSize: '12px',
    }

    const toggleChart = (params) => {
        setActives({
            ...actives,
            [params.value]: !actives[params.value],
        });
    }

    return (
        <VStack position="relative" alignItems="center" maxW={`${chartWidth}px`}>
            <VStack>
                <Text fontWeight="bold">
                    DBR Inflation
                </Text>
                {rangeButtonsBar}
            </VStack>
            <ComposedChart
                width={chartWidth}
                height={400}
                data={_data}
                margin={{
                    top: 20,
                    right: 0,
                    left: 0,
                    bottom: 20,
                }}
                onMouseDown={e => mouseDown(e)}
                onMouseMove={mouseMove}
                // // eslint-disable-next-line react/jsx-no-bind
                onMouseUp={mouseUp}
                onMouseLeave={mouseLeave}
            >
                <defs>
                    <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset={off} stopColor={themeStyles.colors.info} stopOpacity={1} />
                        <stop offset={off} stopColor={themeStyles.colors.warning} stopOpacity={1} />
                    </linearGradient>
                </defs>
                <CartesianGrid fill={themeStyles.colors.accentChartBgColor} stroke="#66666633" strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis minTickGap={28} interval="preserveStartEnd" style={_axisStyle.tickLabels} dataKey="timestamp" scale="time" type={'number'} allowDataOverflow={true} domain={['dataMin', 'dataMax']} tickFormatter={(v) => {
                    return moment(v).format('MMM Do')
                }} />
                <YAxis opacity={(actives[KEYS.INFLATION]) ? 1 : 0} style={_axisStyle.tickLabels} yAxisId="left" domain={leftYDomain} allowDataOverflow={true} tickFormatter={(v) => smartShortNumber(v, 2, useUsd)} />
                <Tooltip
                    wrapperStyle={_axisStyle.tickLabels}
                    labelFormatter={v => moment(v).format('MMM Do YYYY')}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name, d) => {
                        return !value ? 'none' : preciseCommify(value, 0, useUsd)
                    }}
                />
                <Area opacity={actives[KEYS.INFLATION] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.INFLATION} yAxisId="left" type="monotone" dataKey={useUsd ? 'inflationUsd' : 'inflation'} stroke={themeStyles.colors.warning} dot={false} fillOpacity={1} fill="url(#splitColor)" />
                <Legend wrapperStyle={legendStyle} onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
                {zoomReferenceArea}
            </ComposedChart>
        </VStack>
    );
}
