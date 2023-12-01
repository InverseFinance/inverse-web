import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart } from 'recharts';
import moment from 'moment';
import { preciseCommify } from '@app/util/misc';
import { useState } from 'react';
import { useRechartsZoom } from '@app/hooks/useRechartsZoom';

const KEYS = {
    BURN: 'Annualized burn',
    ISSUANCE: 'Annualized issuance',
    DBR_PRICE: 'DBR Price',
    INV_PRICE: 'INV Price',
    INV_MC: 'INV Circ. MC',
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

    const { mouseDown, mouseUp, mouseMove, mouseLeave, zoomOutButton, rangeButtonsBar, zoomReferenceArea, data } = useRechartsZoom({
        combodata, xKey: 'timestamp', yKey: useUsd ? 'debtUsd' : 'debt', yAxisId: 'left', 
        rangesToInclude: ['All', '6M', '3M', '1M', '1W','YTD'],
    });
    const _data = data || combodata;

    const [actives, setActives] = useState({
        [KEYS.BURN]: true,
        [KEYS.ISSUANCE]: true,
        [KEYS.DBR_PRICE]: true,
        [KEYS.INV_MC]: false,
    })

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

    return (
        <VStack position="relative" alignItems="center" maxW={`${chartWidth}px`}>
            <VStack>
                <Text fontWeight="bold">
                    DBR annualized burn & issuance over time
                </Text>
                {rangeButtonsBar}
            </VStack>
            {/* {zoomOutButton} */}
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
                    return moment(v).format('MMM Do')
                }} />
                <YAxis opacity={(actives[KEYS.BURN] || actives[KEYS.ISSUANCE]) ? 1 : 0} style={_axisStyle.tickLabels} yAxisId="left" tickFormatter={(v) => smartShortNumber(v, 2, useUsd)} />
                <YAxis opacity={(actives[KEYS.DBR_PRICE] || actives[KEYS.INV_MC]) ? 1 : 0} style={_axisStyle.tickLabels} yAxisId="right" orientation="right" tickFormatter={(v) => shortenNumber(v, 4, true)} />
                <Tooltip
                    wrapperStyle={_axisStyle.tickLabels}
                    labelFormatter={v => moment(v).format('MMM Do YYYY')}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name, d) => {
                        // trick to show both price without messing up right axis by showing both price lines
                        const _value = name === KEYS.INV_MC ? d.payload.invHistoMarketCap : name === KEYS.DBR_PRICE ? d.payload.histoPrice : value;
                        const isPrice = /price|MC/i.test(name);
                        return !_value ? 'none' : isPrice ? shortenNumber(_value, 4, true) : preciseCommify(_value, 0, useUsd)
                    }}
                />
                <Area opacity={actives[KEYS.BURN] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.BURN} yAxisId="left" type="monotone" dataKey={useUsd ? 'debtUsd' : 'debt'} stroke={themeStyles.colors.warning} dot={false} fillOpacity={1} fill="url(#warning-gradient)" />
                <Area opacity={actives[KEYS.ISSUANCE] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={KEYS.ISSUANCE} yAxisId="left" type="monotone" dataKey={useUsd ? 'yearlyRewardRateUsd' : 'yearlyRewardRate'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={1} fill="url(#secondary-gradient)" />
                <Line opacity={actives[KEYS.DBR_PRICE] ? 1 : 0} strokeWidth={2} name={KEYS.DBR_PRICE} yAxisId="right" type="monotone" dataKey={priceKey} stroke={dbrPriceColor} dot={false} />
                <Line opacity={actives[KEYS.INV_MC] ? 1 : 0} strokeWidth={2} name={KEYS.INV_MC} yAxisId="right" type="monotone" dataKey={priceKey} stroke={invPriceColor} dot={false} />
                <Legend wrapperStyle={legendStyle} onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
                {zoomReferenceArea}
            </ComposedChart>
        </VStack>
    );
}
