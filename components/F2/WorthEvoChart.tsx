import { useAppTheme } from "@app/hooks/useAppTheme";
import { useFirmMarketEvolution, useHistoricalPrices } from "@app/hooks/useFirm";
import { F2Market } from "@app/types";
import { VStack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ComposedChart } from 'recharts';
import moment from 'moment';
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { useAccount } from "@app/hooks/misc";
import { preciseCommify } from "@app/util/misc";

export const WorthEvoChartContainer = ({
    market
}: {
    market: F2Market,
}) => {
    const account = useAccount();
    const { prices } = useHistoricalPrices(market.underlying.coingeckoId);
    const { events } = useFirmMarketEvolution(market, account);
    const start = events ? events[0]?.timestamp : undefined;

    const data = prices
        .filter(p => p[0] > start)
        .map((p) => {
            const depositedByUser = events.findLast(e => e.timestamp <= p[0])?.depositedByUser || 0;
            return {
                timestamp: p[0],
                histoPrice: p[1],
                worth: depositedByUser * p[1],
                depositedByUser,
            }
        });

    const hasData = data?.length > 0;
    const startPrice = hasData ? data[0].histoPrice : 0;
    const lastPrice = hasData ? data[data.length - 1].histoPrice : 0;
    const priceChangeFromStart = hasData ? (lastPrice - startPrice)/startPrice * 100 : 0;

    return <WorthEvoChart
        chartWidth={700}
        data={data}
    />
}

const keyNames = {
    'histoPrice': 'Price',
    'worth': 'USD worth',
}

export const WorthEvoChart = ({
    chartWidth,
    data,
    axisStyle,
    useUsd = false
}: {
    chartWidth: number,
    data: any[],
    axisStyle?: any,
    useUsd?: boolean,
}) => {
    const { themeStyles } = useAppTheme();
    const [brushIndexes, setBrushIndexes] = useState({ startIndex: undefined, endIndex: undefined });
    const [actives, setActives] = useState(Object.values(keyNames).reduce((acc, cur) => ({ ...acc, [cur]: true }), {}));
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

    const handleBrush = (params) => {
        setBrushIndexes(params);
    }

    return <VStack alignItems="center" maxW={`${chartWidth}px`}>
        <Text>
            DBR price and annualized burn & issuance
        </Text>
        <ComposedChart
            width={chartWidth}
            height={400}
            data={data}
            margin={{
                top: 20,
                right: 0,
                left: 0,
                bottom: 20,
            }}
        >
            <CartesianGrid strokeDasharray={_axisStyle.grid.strokeDasharray} />
            <XAxis minTickGap={28} interval="preserveStartEnd" style={_axisStyle.tickLabels} dataKey="timestamp" scale="time" type={'number'} allowDataOverflow={true} domain={['dataMin', 'dataMax']} tickFormatter={(v) => {
                return moment(v).format('MMM Do')
            }} />
            <YAxis style={_axisStyle.tickLabels} yAxisId="left" tickFormatter={(v) => smartShortNumber(v, 2, true)} />
            <YAxis style={_axisStyle.tickLabels} yAxisId="right" orientation="right" tickFormatter={(v) => shortenNumber(v, 4, true)} />
            <Tooltip
                wrapperStyle={_axisStyle.tickLabels}
                labelFormatter={v => moment(v).format('MMM Do YYYY')}
                labelStyle={{ fontWeight: 'bold' }}
                itemStyle={{ fontWeight: 'bold' }}
                formatter={(value, name) => {
                    const isPrice = name === 'Price';
                    return !value ? 'none' : isPrice ? shortenNumber(value, 4, true) : preciseCommify(value, 0, true)
                }}
            />
            <Legend wrapperStyle={_axisStyle.tickLabels} onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
            {/* <Area opacity={actives["Annualized DBR burn"] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name="Annualized DBR burn" yAxisId="left" type="monotone" dataKey={useUsd ? 'debtUsd' : 'debt'} stroke={themeStyles.colors.warning} dot={false} fillOpacity={1} fill="url(#warning-gradient)" /> */}
            <Area opacity={actives[keyNames["worth"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["worth"]} yAxisId="left" type="monotone" dataKey={'worth'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={1} fill="url(#secondary-gradient)" />
            <Line opacity={actives[keyNames["histoPrice"]] ? 1 : 0} strokeWidth={2} name={keyNames["histoPrice"]} yAxisId="right" type="monotone" dataKey="histoPrice" stroke={themeStyles.colors.info} dot={false} />
            {/* <Brush onChange={handleBrush} startIndex={brushIndexes.startIndex} endIndex={brushIndexes.endIndex} dataKey="timestamp" height={30} stroke="#8884d8" tickFormatter={(v) => ''} /> */}
        </ComposedChart>
    </VStack>
}