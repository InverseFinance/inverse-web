import { useAppTheme } from '@app/hooks/useAppTheme';
import { shortenNumber, smartShortNumber } from '@app/util/markets';
import { LineChart, AreaChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import { preciseCommify } from '@app/util/misc';

export const DbrComboChart = ({
    combodata,
    chartWidth,
    axisStyle,
    useUsd = false,
}) => {
    const { themeStyles } = useAppTheme();

    const _axisStyle = axisStyle || {
        tickLabels: { fill: themeStyles.colors.mainTextColor, fontFamily: 'Inter', fontSize: '12px' },
        grid: {
            stroke: '#66666633',
            strokeDasharray: '4 4',
        }
    }

    return (
        //   <ResponsiveContainer width="500px" height="300px">
        <LineChart
            width={chartWidth}
            height={300}
            data={combodata}
            margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray={_axisStyle.grid.strokeDasharray} />
            <XAxis style={_axisStyle.tickLabels} dataKey="timestamp" scale="time" tickFormatter={v => moment(v).format('MMM-YY')} />
            <YAxis style={_axisStyle.tickLabels} yAxisId="left" tickFormatter={(v) => smartShortNumber(v)} />
            <YAxis style={_axisStyle.tickLabels} yAxisId="right" orientation="right" tickFormatter={(v) => shortenNumber(v, 4, true)} />
            <Tooltip
                wrapperStyle={_axisStyle.tickLabels}
                //   content={(props) => <DbrComboTooltip {...props} />}
                labelFormatter={v => moment(v).format('MMM Do YYYY')}
                labelStyle={{ fontWeight: 'bold' }}
                itemStyle={{ fontWeight: 'bold' }}
                formatter={(value, name) => {
                    const isPrice = name === 'Price';
                    return !value ? 'none' : isPrice ? shortenNumber(value, 4, true) : preciseCommify(value, 0, useUsd)
                }}
            />
            <Legend wrapperStyle={_axisStyle.tickLabels} />
            <Line strokeWidth={2} name="Annualized DBR burn" yAxisId="left" type="monotone" dataKey="debt" stroke={themeStyles.colors.accentTextColor} dot={false} />
            <Line strokeWidth={2} name="Annualized DBR issuance" yAxisId="left" type="monotone" dataKey="yearlyRewardRate" stroke={themeStyles.colors.secondary} dot={false} />
            <Line strokeWidth={2} name="Price" yAxisId="right" type="monotone" dataKey="histoPrice" stroke={themeStyles.colors.info} dot={false} />
        </LineChart>
        //   </ResponsiveContainer>
    );
}
