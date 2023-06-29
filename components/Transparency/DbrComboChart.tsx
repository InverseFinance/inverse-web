import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ComposedChart } from 'recharts';
import moment from 'moment';
import { preciseCommify } from '@app/util/misc';
import { useEffect, useState } from 'react';

const KEYS = {
    BURN: 'Annualized burn',
    ISSUANCE: 'Annualized issuance',
    DBR_PRICE: 'DBR Price',
    INV_PRICE: 'INV Price',
}

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
    const [brushIndexes, setBrushIndexes] = useState({ startIndex: undefined, endIndex: undefined });
    const [actives, setActives] = useState({
        [KEYS.BURN]: true,
        [KEYS.ISSUANCE]: true,
        [KEYS.DBR_PRICE]: true,
        [KEYS.INV_PRICE]: false,
    })

    useEffect(() => {
        if (brushIndexes.startIndex !== undefined || !combodata || combodata.length < 250) {
            return;
        }
        setBrushIndexes({ startIndex: 220, endIndex: combodata.length - 1 });
    }, [combodata, brushIndexes]);

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '14px' },
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

    const toggleChart = (params) => {
        setActives({
            ...actives,
            [KEYS.INV_PRICE]: params.value === KEYS.DBR_PRICE ? false : actives[KEYS.INV_PRICE],
            [KEYS.DBR_PRICE]: params.value === KEYS.INV_PRICE ? false : actives[KEYS.DBR_PRICE],
            [params.value]: !actives[params.value],
        });
    }

    const priceKey = actives[KEYS.DBR_PRICE] ? 'histoPrice' : 'invHistoPrice';
    const dbrPriceColor = themeStyles.colors.info;
    const invPriceColor = themeName === 'light' ? themeStyles.colors.mainTextColor : 'lightblue';

    const handleBrush = (params) => {
        setBrushIndexes(params);
    }

    return (
        <VStack alignItems="center" maxW={`${chartWidth}px`}>
            <Text fontWeight="bold">
                DBR annualized burn & issuance over time
            </Text>
            <ComposedChart
                width={chartWidth}
                height={400}
                data={combodata}
                margin={{
                    top: 20,
                    right: 0,
                    left: 0,
                    bottom: 20,
                }}
            >
                <CartesianGrid fill={themeStyles.colors.accentChartBgColor} stroke="#66666633" strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis minTickGap={28} interval="preserveStartEnd" style={_axisStyle.tickLabels} dataKey="timestamp" scale="time" type={'number'} allowDataOverflow={true} domain={['dataMin', 'dataMax']} tickFormatter={(v) => {
                    return moment(v).format('MMM Do')
                }} />
                <YAxis style={_axisStyle.tickLabels} yAxisId="left" tickFormatter={(v) => smartShortNumber(v, 2, useUsd)} />
                <YAxis style={_axisStyle.tickLabels} yAxisId="right" orientation="right" tickFormatter={(v) => shortenNumber(v, 4, true)} />
                <Tooltip
                    wrapperStyle={_axisStyle.tickLabels}
                    labelFormatter={v => moment(v).format('MMM Do YYYY')}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name) => {
                        const isPrice = name === 'Price';
                        return !value ? 'none' : isPrice ? shortenNumber(value, 4, true) : preciseCommify(value, 0, useUsd)
                    }}
                />
                <Legend wrapperStyle={legendStyle} onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
                <Area opacity={actives[KEYS.BURN] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.BURN} yAxisId="left" type="monotone" dataKey={useUsd ? 'debtUsd' : 'debt'} stroke={themeStyles.colors.warning} dot={false} fillOpacity={1} fill="url(#warning-gradient)" />
                <Area opacity={actives[KEYS.ISSUANCE] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.ISSUANCE} yAxisId="left" type="monotone" dataKey={useUsd ? 'yearlyRewardRateUsd' : 'yearlyRewardRate'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={1} fill="url(#secondary-gradient)" />
                <Line opacity={actives[KEYS.DBR_PRICE] ? 1 : 0} strokeWidth={2} name={KEYS.DBR_PRICE} yAxisId="right" type="monotone" dataKey={priceKey} stroke={dbrPriceColor} dot={false} />
                <Line opacity={actives[KEYS.INV_PRICE] ? 1 : 0} strokeWidth={2} name={KEYS.INV_PRICE} yAxisId="right" type="monotone" dataKey={priceKey} stroke={invPriceColor} dot={false} />
                <Brush onChange={handleBrush} startIndex={brushIndexes.startIndex} endIndex={brushIndexes.endIndex} dataKey="timestamp" height={30} stroke="#8884d8" tickFormatter={(v) => ''} />
            </ComposedChart>
        </VStack>
    );
}
