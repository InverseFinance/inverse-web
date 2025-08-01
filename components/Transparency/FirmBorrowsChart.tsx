import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { smartShortNumber } from '@app/util/markets';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, Line, ReferenceLine } from 'recharts';
 ;
import { preciseCommify } from '@app/util/misc';
import { useEffect, useState } from 'react';
import { useRechartsZoom } from '@app/hooks/useRechartsZoom';
import { formatDate, formatDay } from '@app/util/time';

const KEYS = {
    BURN: 'Borrows',
    INVENTORY: 'Inventory days',
    TOTAL_USER_DBR_BALANCE: 'Total user DBR holdings',
}

const CURRENT_YEAR = new Date().getFullYear().toString();

export const FirmBorrowsChart = ({
    combodata,
    chartWidth = 900,
    axisStyle,
    useUsd = false,
}: {
    combodata: { debt: number, dbrUsd: number, timestamp: number, histoPrice: number, yearlyRewardRateUsd: number, yearlyRewardRate: number }[]
    axisStyle?: any
    chartWidth?: number
    useUsd?: boolean
}) => {
    const { themeStyles, themeName } = useAppTheme();
    const [leftYDomain, setLeftYDomain] = useState(['dataMin', 'dataMax']);

    const { mouseDown, mouseUp, mouseMove, mouseLeave, zoomOutButton, rangeButtonsBar, zoomReferenceArea, data } = useRechartsZoom({
        combodata, xKey: 'timestamp', yKey: useUsd ? 'debtUsd' : 'debt', yAxisId: 'left', 
        defaultRange: '2Y',
        rangesToInclude: ['All', '2Y', '1Y', '6M', '1M', '1W','YTD'],
    });
    const _data = data || combodata;

    const [actives, setActives] = useState({
        [KEYS.BURN]: true,
        [KEYS.INVENTORY]: true,
        [KEYS.TOTAL_USER_DBR_BALANCE]: true,
    });

    useEffect(() => {
        if(!combodata?.length) {
            return;
        }
        const suffix = useUsd ? 'Usd' : '';
        const keys = ([actives[KEYS.BURN] ? 'debt'+suffix : '', 'inventory', 'totalUserDbrBalance'])
            .filter(d => !!d);
        
        const dataMin = Math.min(...combodata.map(d => Math.min(...keys.map(k => (d[k]||0)))));
        const dataMax = Math.max(...combodata.map(d => Math.max(...keys.map(k => (d[k]||0)))));
        setLeftYDomain([dataMin, Math.ceil(dataMax*1.05)]);
    }, [actives, combodata, useUsd]);

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '14px', userSelect: 'none'  },
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

    const doesDataSpansSeveralYears = _data?.filter(d => d.date.endsWith('01-01')).length > 1;

    return (
        <VStack position="relative" alignItems="center" maxW={`${chartWidth}px`}>
            <VStack>
                <Text className="heading-font" fontWeight="bold">
                    FiRM Borrows & DBR Inventory days
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
                <CartesianGrid fill={themeStyles.colors.accentChartBgColor} stroke="#66666633" strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis minTickGap={28} interval="preserveStartEnd" style={_axisStyle.tickLabels} dataKey="timestamp" scale="time" type={'number'} allowDataOverflow={true} domain={['dataMin', 'dataMax']} tickFormatter={(v) => {
                    return formatDay(v)
                }} />
                <YAxis style={_axisStyle.tickLabels} yAxisId="left" domain={leftYDomain} allowDataOverflow={true} tickFormatter={(v) => v > 10_000_000 ? smartShortNumber(v, 0, useUsd) : smartShortNumber(v, 2, useUsd)} />
                <YAxis style={_axisStyle.tickLabels} yAxisId="right" orientation="right" allowDataOverflow={true} tickFormatter={(v) => smartShortNumber(v, 2)} />
                <Tooltip
                    wrapperStyle={_axisStyle.tickLabels}
                    labelFormatter={v => formatDate(v)}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name, d) => {
                        return !value ? 'none' : preciseCommify(value, 0, useUsd)
                    }}
                />
                <Line opacity={actives[KEYS.INVENTORY] ? 1 : 0} strokeWidth={2} name={KEYS.INVENTORY} yAxisId="right" type="monotone" dataKey={'inventory'} stroke={themeStyles.colors.info} dot={false} />
                <Area opacity={actives[KEYS.BURN] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.BURN} yAxisId="left" type="monotone" dataKey={useUsd ? 'debtUsd' : 'debt'} stroke={themeStyles.colors.warning} dot={false} fillOpacity={1} fill="url(#warning-gradient)" />
                <Area opacity={actives[KEYS.TOTAL_USER_DBR_BALANCE] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.TOTAL_USER_DBR_BALANCE} yAxisId="left" type="monotone" dataKey={useUsd ? 'totalUserDbrBalanceUsd' : 'totalUserDbrBalance'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={1} fill="url(#secondary-gradient)" />
                <Legend wrapperStyle={legendStyle} onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
                {
                    _data.filter(d => d.date.endsWith('01-01')).map(d => {
                        return <ReferenceLine
                            key={`x-${d.timestamp}`}
                            yAxisId={"left"}
                            position="start"
                            isFront={true}
                            x={d.timestamp}
                            stroke={themeStyles.colors.mainTextColor}
                            strokeWidth={`1`}
                            strokeDasharray={'4 4'}
                            label={{
                                value: d.date.substring(0, 4),
                                position: d.date.substring(0, 4) === CURRENT_YEAR && doesDataSpansSeveralYears ? 'insideRight' : 'insideLeft',
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
