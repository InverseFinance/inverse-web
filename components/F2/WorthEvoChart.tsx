import { useAppTheme } from "@app/hooks/useAppTheme";
import { useFirmMarketEvolution, useHistoricalPrices } from "@app/hooks/useFirm";
import { F2Market } from "@app/types";
import { VStack, Text } from "@chakra-ui/react";
import { useContext, useState } from "react";
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ComposedChart, ReferenceLine } from 'recharts';
import moment from 'moment';
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { useAccount } from "@app/hooks/misc";
import { preciseCommify, timestampToUTC } from "@app/util/misc";
import { ONE_DAY_MS } from "@app/config/constants";
import { F2MarketContext } from "./F2Contex";

export const WorthEvoChartContainer = ({
    market
}: {
    market: F2Market,
}) => {
    const account = useAccount();
    const { deposits } = useContext(F2MarketContext);
    const { prices } = useHistoricalPrices(market.underlying.coingeckoId);
    const { prices: dbrPrices } = useHistoricalPrices('dola-borrowing-right');
    const { events, depositedByUser } = useFirmMarketEvolution(market, account);
    const start = events ? events[0]?.timestamp : undefined;

    const collateralRewards = (deposits) - depositedByUser;

    const pricesAtEvents = events.map(e => {
        const price = prices.find(p => timestampToUTC(p[0]) === timestampToUTC(e.timestamp))?.[1];
        return [e.timestamp, price];
    }).filter(p => p[0] && !!p[1]);

    const now = Date.now();

    const allPrices = [
        ...pricesAtEvents,
        ...prices,
        [now, prices.find(p => timestampToUTC(p[0]) === timestampToUTC(now))?.[1] || 0],
    ].sort((a, b) => a[0] - b[0]);

    const relevantPrices = allPrices
        .filter(p => p[0] > start - ONE_DAY_MS * 2);

    const data = relevantPrices.map((p, i) => {
        const event = events.find(e => !e.isClaim && e.timestamp === p[0]);
        const lastCollateralEvent = events.findLast(e => !e.isClaim && e.timestamp <= p[0]);
        const depositedByUser = Math.max(lastCollateralEvent?.depositedByUser || 0, 0);
        const claimEvent = events.find(e => e.isClaim && e.timestamp === p[0]);
        const lastClaimEvent = events.findLast(e => e.isClaim && e.timestamp <= p[0]);
        const claims = lastClaimEvent?.claims || 0;
        const dbrPrice = dbrPrices.find(dbrPrice => timestampToUTC(dbrPrice[0]) === timestampToUTC(p[0]))?.[1] || 0;
        const timeProgression = (p[0] - start) / (now - start);
        // TODO: better estimation
        const estimatedStakedBonus = depositedByUser ? Math.max(collateralRewards * timeProgression, 0) : 0;
        const claimsUsd = claims * dbrPrice;
        return {
            timestamp: p[0],
            histoPrice: p[1],
            dbrPrice,
            eventName: !!claimEvent ? 'Claim' : event?.actionName,
            claimEvent,
            isClaimEvent: !!claimEvent,
            isEvent: !!event,
            worth: depositedByUser * p[1],
            totalWorth: claimsUsd + depositedByUser * p[1] + estimatedStakedBonus * p[1],
            depositedByUser,
            claims,
            timeProgression,
            estimatedStakedBonus,
            estimatedStakedBonusUsd: estimatedStakedBonus * p[1],
            claimsUsd,
        }
    });

    const hasData = data?.length > 0;
    const startPrice = hasData ? data[0].histoPrice : 0;
    const lastPrice = hasData ? data[data.length - 1].histoPrice : 0;
    const priceChangeFromStart = hasData ? (lastPrice - startPrice) / startPrice * 100 : 0;

    return <WorthEvoChart
        chartWidth={700}
        data={data}
    />
}

const keyNames = {
    'histoPrice': 'Price',
    'worth': 'USD worth',
    'totalWorth': 'Total USD worth',
    'claimsUsd': 'Claims worth',
}

const LABEL_POSITIONS = {
    'Claim': 'center',
    'Deposit': 'insideTop',
    'Borrow': 'centerTop',
    'Withdraw': 'centerBottom',
    'Repay': 'insideBottom',
}

const LABEL_COLORS = {
    'Claim': 'green',
    'Deposit': 'blue',
    'Borrow': 'blue',
    'Withdraw': 'blue',
    'Repay': 'blue',
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
            <Area opacity={actives[keyNames["totalWorth"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["totalWorth"]} yAxisId="left" type="monotone" dataKey={'totalWorth'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" />
            {/* <Area opacity={actives[keyNames["worth"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["worth"]} yAxisId="left" type="monotone" dataKey={'worth'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" /> */}
            {/* <Area opacity={actives[keyNames["claimsUsd"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["claimsUsd"]} yAxisId="left" type="monotone" dataKey={'claimsUsd'} stroke={themeStyles.colors.mainTextColor} dot={false} fillOpacity={0.5} fill="url(#primary-gradient)" /> */}
            <Line opacity={actives[keyNames["histoPrice"]] ? 1 : 0} strokeWidth={2} name={keyNames["histoPrice"]} yAxisId="right" type="monotone" dataKey="histoPrice" stroke={themeStyles.colors.info} dot={false} />
            {/* <Line opacity={actives[keyNames["dbrPrice"]] ? 1 : 0} strokeWidth={2} name={keyNames["dbrPrice"]} yAxisId="right" type="monotone" dataKey="dbrPrice" stroke={themeStyles.colors.info} dot={false} /> */}
            {
                data
                    .filter(d => d.isClaimEvent)
                    .map(d => {
                        return <ReferenceLine position="start" isFront={true} yAxisId="left" x={d.timestamp} stroke={LABEL_COLORS[d.eventName]} label={{ value: 'Claim', position: LABEL_POSITIONS[d.eventName], fill: LABEL_COLORS[d.eventName] }} />
                    })
            }
            {
                data
                    .filter(d => !d.isClaimEvent && d.isEvent)
                    .map(d => {
                        return <ReferenceLine position="start" isFront={true} yAxisId="left" x={d.timestamp} stroke={LABEL_COLORS[d.eventName]} label={{ value: d.eventName, position: LABEL_POSITIONS[d.eventName], fill: LABEL_COLORS[d.eventName] }} />
                    })
            }
            {/* <Brush onChange={handleBrush} startIndex={brushIndexes.startIndex} endIndex={brushIndexes.endIndex} dataKey="timestamp" height={30} stroke="#8884d8" tickFormatter={(v) => ''} /> */}
        </ComposedChart>
    </VStack>
}