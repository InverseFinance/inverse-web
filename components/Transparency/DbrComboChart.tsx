import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart, ReferenceLine } from 'recharts';
import { preciseCommify } from '@app/util/misc';
import { useEffect, useState } from 'react';
import { useRechartsZoom } from '@app/hooks/useRechartsZoom';
import { lightTheme } from '@app/variables/theme';
import { formatDate, formatDay } from '@app/util/time';

const KEYS = {
    BURN: 'Annualized burn',
    ISSUANCE: 'Annualized issuance (total)',
    STAKERS_ISSUANCE: 'Annualized issuance (stakers)',
    DBR_PRICE: 'DBR Price',
    INV_PRICE: 'INV Price',
    INV_MC: 'INV Circ. MC',
    DBR_MC: 'DBR Circ. Supply',
}

const CURRENT_YEAR = new Date().getFullYear().toString();

export const DbrComboChart = ({
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
        rangesToInclude: ['All', '1Y', '6M', '3M', '1M', '1W','YTD'],
    });
    const _data = data || combodata;

    const [actives, setActives] = useState({
        [KEYS.BURN]: true,
        [KEYS.ISSUANCE]: true,
        [KEYS.DBR_MC]: true,
        [KEYS.STAKERS_ISSUANCE]: false,        
        // right y axis
        [KEYS.DBR_PRICE]: true,
        [KEYS.INV_MC]: false,
    });

    useEffect(() => {
        if(!combodata?.length) {
            return;
        }
        const suffix = useUsd ? 'Usd' : '';
        const keys = ([actives[KEYS.DBR_MC] ? 'dbrCircSupply'+suffix : '',actives[KEYS.BURN] ? 'debt'+suffix : '', actives[KEYS.ISSUANCE] ? 'yearlyRewardRate'+suffix : '', actives[KEYS.STAKERS_ISSUANCE] ? 'stakersYearlyRewardRate'+suffix : ''])
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
            [KEYS.INV_MC]: params.value === KEYS.DBR_PRICE ? false : actives[KEYS.INV_MC],
            [KEYS.DBR_PRICE]: params.value === KEYS.INV_MC ? false : actives[KEYS.DBR_PRICE],
            [params.value]: !actives[params.value],
        });
    }

    const priceKey = actives[KEYS.DBR_PRICE] ? 'histoPrice' : 'invHistoMarketCap';
    const dbrPriceColor = themeStyles.colors.info;
    const invPriceColor = themeName === 'light' ? themeStyles.colors.mainTextColor : 'lightblue';
    const doesDataSpansSeveralYears = _data?.filter(d => d.date.endsWith('01-01')).length > 1;

    return (
        <VStack position="relative" alignItems="center" maxW={`${chartWidth}px`}>
            <VStack>
                <Text className="heading-font" fontWeight="bold">
                    DBR annualized burn & issuance over time
                </Text>
                {rangeButtonsBar}
            </VStack>
            {/* {zoomOutButton} */}
            <ComposedChart
                width={chartWidth}
                height={chartWidth > 1000 ? 500 : 400}
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
                <YAxis opacity={(actives[KEYS.BURN] || actives[KEYS.ISSUANCE]|| actives[KEYS.STAKERS_ISSUANCE] || actives[KEYS.DBR_MC]) ? 1 : 0} style={_axisStyle.tickLabels} yAxisId="left" domain={leftYDomain} allowDataOverflow={true} tickFormatter={(v) => v > 10_000_000 ? smartShortNumber(v, 0, useUsd) : smartShortNumber(v, 2, useUsd)} />
                <YAxis opacity={(actives[KEYS.DBR_PRICE] || actives[KEYS.INV_MC]) ? 1 : 0} style={_axisStyle.tickLabels} yAxisId="right" orientation="right" allowDataOverflow={true} tickFormatter={(v) => shortenNumber(v, 4, true)} />
                <Tooltip
                    wrapperStyle={_axisStyle.tickLabels}
                    labelFormatter={v => formatDate(v)}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name, d) => {
                        // trick to show both price without messing up right axis by showing both price lines
                        const _value = name === KEYS.INV_MC ? d.payload.invHistoMarketCap : name === KEYS.DBR_PRICE ? d.payload.histoPrice : value;
                        const isPrice = /price|MC/i.test(name);
                        return !_value ? 'none' : isPrice ? shortenNumber(_value, 4, true) : preciseCommify(_value, 0, useUsd)
                    }}
                />
                <Area opacity={actives[KEYS.BURN] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.BURN} yAxisId="left" type="monotone" dataKey={actives[KEYS.BURN] ? useUsd ? 'debtUsd' : 'debt' : ''} stroke={themeStyles.colors.warning} dot={false} fillOpacity={1} fill="url(#warning-gradient)" />
                <Area opacity={actives[KEYS.ISSUANCE] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.ISSUANCE} yAxisId="left" type="monotone" dataKey={actives[KEYS.ISSUANCE] ? useUsd ? 'yearlyRewardRateUsd' : 'yearlyRewardRate' : ''} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={1} fill="url(#secondary-gradient)" />
                <Area opacity={actives[KEYS.STAKERS_ISSUANCE] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.STAKERS_ISSUANCE} yAxisId="left" type="monotone" dataKey={actives[KEYS.STAKERS_ISSUANCE] ? useUsd ? 'stakersYearlyRewardRateUsd' : 'stakersYearlyRewardRate' : ''} stroke={lightTheme.colors.mainTextColor} dot={false} fillOpacity={1} fill="url(#primary-gradient)" />
                <Line opacity={actives[KEYS.DBR_MC] ? 1 : 0} strokeWidth={2} name={KEYS.DBR_MC} yAxisId="left" type="monotone" dataKey={actives[KEYS.DBR_MC] ? useUsd ? 'dbrCircSupplyUsd' : 'dbrCircSupply' : ''} stroke={lightTheme.colors.accentTextColor} dot={false} />
                <Line opacity={actives[KEYS.DBR_PRICE] ? 1 : 0} strokeWidth={2} name={KEYS.DBR_PRICE} yAxisId="right" type="monotone" dataKey={actives[KEYS.DBR_PRICE] ? priceKey : ''} stroke={dbrPriceColor} dot={false} />
                <Line opacity={actives[KEYS.INV_MC] ? 1 : 0} strokeWidth={2} name={KEYS.INV_MC} yAxisId="right" type="monotone" dataKey={actives[KEYS.INV_MC] ? priceKey : ''} stroke={invPriceColor} dot={false} />
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
