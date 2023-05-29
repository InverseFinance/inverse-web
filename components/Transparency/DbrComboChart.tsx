import { useAppTheme } from '@app/hooks/useAppTheme';
import { VStack, Text } from '@chakra-ui/react'
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ComposedChart } from 'recharts';
import moment from 'moment';
import { preciseCommify } from '@app/util/misc';
import { useState } from 'react';

export const DbrComboChart = ({
    combodata,
    chartWidth,
    axisStyle,
    useUsd = false,
}: {
    axisStyle?: any
}) => {
    const { themeStyles } = useAppTheme();
    const [actives, setActives] = useState({
        "Annualized DBR burn": true,
        "Annualized DBR issuance": true,
        "Price": true,
    })

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '12px' },
        grid: {
            stroke: '#66666633',
            strokeDasharray: '4 4',
        }
    }

    const toggleChart = (params) => {
        setActives({ ...actives, [params.value]: !actives[params.value] })
    }

    return (
        <VStack>
            <Text>
                DBR price and annualized burns & issuance
            </Text>
            <ComposedChart
                width={chartWidth}
                height={300}
                data={combodata}
                margin={{
                    top: 50,
                    right: 50,
                    left: 50,
                    bottom: 0,
                }}
            >
                <CartesianGrid strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis style={_axisStyle.tickLabels} dataKey="timestamp" scale="time" tickFormatter={v => moment(v).format('MMM-YY')} />
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
                <Legend wrapperStyle={_axisStyle.tickLabels} onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
                <Area opacity={actives["Annualized DBR burn"] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name="Annualized DBR burn" yAxisId="left" type="monotone" dataKey={useUsd ? 'debtUsd' : 'debt'} stroke={themeStyles.colors.warning} dot={false} fillOpacity={1} fill="url(#warning-gradient)" />
                <Area opacity={actives["Annualized DBR issuance"] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name="Annualized DBR issuance" yAxisId="left" type="monotone" dataKey={useUsd ? 'yearlyRewardRateUsd' : 'yearlyRewardRate'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={1} fill="url(#secondary-gradient)" />
                <Line opacity={actives["Price"] ? 1 : 0} strokeWidth={2} name="Price" yAxisId="right" type="monotone" dataKey="histoPrice" stroke={themeStyles.colors.info} dot={false} />
                <Brush dataKey="timestamp" height={30} stroke="#8884d8" tickFormatter={(v) => moment(v).format('MMM Do YYYY')} />
            </ComposedChart>
        </VStack>
    );
}
