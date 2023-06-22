import { useAppTheme } from "@app/hooks/useAppTheme";
import { F2Market } from "@app/types";
import { VStack, Text, FormControl, Switch, Stack, HStack, Popover, PopoverTrigger, PopoverContent } from "@chakra-ui/react";
import { useState } from "react";
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ComposedChart, ReferenceLine } from 'recharts';
import moment from 'moment';
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc";
import Container from "../common/Container";

const LABEL_POSITIONS = {
    'Claim': 'center',
    'Deposit': 'insideTopLeft',
    'Borrow': 'insideRight',
    'Withdraw': 'insideBottomLeft',
    'Repay': 'insideBotttomRight',
    'ForceReplenish': 'insideTop',
    'Liquidate': 'top',
}

const EVENT_DASHES = {
    'Claim': undefined,
    'Deposit': undefined,
    'Borrow': undefined,
    'Withdraw': '4 4',
    'Repay': '4 4',
    'ForceReplenish': '4 4',
    'Liquidate': undefined,
}

const EVENT_WIDTHS = {
    'Claim': undefined,
    'Deposit': undefined,
    'Borrow': undefined,
    'Withdraw': undefined,
    'Repay': undefined,
    'ForceReplenish': 4,
    'Liquidate': 4,
}

export const WorthEvoChart = ({
    chartWidth,
    data,
    axisStyle,
    market,
    useUsd = false,
}: {
    chartWidth: number,
    data: any[],
    axisStyle?: any,
    market: F2Market,
    useUsd?: boolean,
}) => {
    const { themeStyles } = useAppTheme();

    const keyNames = {
        'histoPrice': `${market.name} price`,
        'worth': 'USD worth',
        'totalWorth': 'Total USD worth',
        'claimsUsd': 'Claims worth',
        'debt': 'DOLA debt',
        'estimatedStakedBonusUsd': 'Staking earnings',
    }

    const LABEL_COLORS = {
        'Claim': themeStyles.colors.success,
        'Deposit': themeStyles.colors.mainTextColor,
        'Borrow': themeStyles.colors.accentTextColor,
        'Withdraw': themeStyles.colors.mainTextColor,
        'Repay': themeStyles.colors.accentTextColor,
        'ForceReplenish': themeStyles.colors.error,
        'Liquidate': themeStyles.colors.error,
    };

    const EvoChartEventLegend = () => {
        const eventTypes = Object.keys(EVENT_DASHES)
            .filter(e => market.hasClaimableRewards ? true : e !== 'Claim')
            .sort((a, b) => a < b ? -1 : 1);

        return <VStack alignItems="flex-start">
            {
                eventTypes.map((eventType, i) => {
                    return <HStack spacing="2">
                        <Text w='130px'>{eventType.replace('Claim', 'Claim rewards')}:</Text>
                        <Text
                            minW="1px"
                            h="20px"
                            borderColor={LABEL_COLORS[eventType]}
                            borderStyle={EVENT_DASHES[eventType] ? 'dashed' : undefined}
                            borderWidth={'2px'}></Text>
                    </HStack>
                })
            }
        </VStack>
    }

    const [showCollateral, setShowCollateral] = useState(true);
    const [showEvents, setShowEvents] = useState(false);
    const [showDebt, setShowDebt] = useState(true);
    const [showEventsLabel, setShowEventsLabel] = useState(false);
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

    return <Container
        p="0"
        noPadding
        label={`Your Position Evolution in the ${market.name} Market`}
    >
        <VStack alignItems="center" maxW={`${chartWidth}px`}>
            <Stack w='full' justify="flex-start" alignItems="flex-start" direction="column">
                <Stack w='full' spacing={{ base: '2', sm: '8' }} direction={{ base: 'column', sm: 'row' }}>
                    <FormControl w='fit-content' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                        <Text mr="2" onClick={() => setShowCollateral(!showCollateral)}>
                            Show collateral
                        </Text>
                        <Switch onChange={(e) => setShowCollateral(!showCollateral)} size="sm" colorScheme="purple" isChecked={showCollateral} />
                    </FormControl>
                    <FormControl w='fit-content' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                        <Text mr="2" onClick={() => setShowDebt(!showDebt)}>
                            Show debt
                        </Text>
                        <Switch onChange={(e) => setShowDebt(!showDebt)} size="sm" colorScheme="purple" isChecked={showDebt} />
                    </FormControl>
                    <FormControl w='fit-content' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                        <Text mr="2" onClick={() => setShowEvents(!showEvents)}>
                            Show events
                        </Text>
                        <Switch onChange={(e) => setShowEvents(!showEvents)} size="sm" colorScheme="purple" isChecked={showEvents} />
                    </FormControl>
                    <HStack cursor="help" visibility={!showEvents ? 'hidden' : 'visible'}>
                        <Popover trigger="hover" placement="right-end">
                            <PopoverTrigger>
                                <Text color={themeStyles.colors.mainTextColorLight2} textDecoration="underline">
                                    See Events Legend
                                </Text>
                            </PopoverTrigger>
                            <PopoverContent p="4">
                                <EvoChartEventLegend />
                            </PopoverContent>
                        </Popover>
                    </HStack>
                    {/* {
                    showEvents && <FormControl w='fit-content' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                        <Text mr="2" onClick={() => setShowEventsLabel(!showEventsLabel)}>
                            Show events
                        </Text>
                        <Switch onChange={(e) => setShowEventsLabel(!showEventsLabel)} size="sm" colorScheme="purple" isChecked={showEventsLabel} />
                    </FormControl>
                } */}
                </Stack>
            </Stack>
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
                        const isPrice = name === keyNames['histoPrice'];
                        return !value ? 'none' : isPrice ? shortenNumber(value, 4, true) : preciseCommify(value, 0, true)
                    }}
                />
                <Legend wrapperStyle={{
                    ..._axisStyle.tickLabels,
                    fontSize: '16px',
                    fontWeight: 'bold',
                }}
                    onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
                {
                    showCollateral && <Area opacity={actives[keyNames["totalWorth"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["totalWorth"]} yAxisId="left" type="monotone" dataKey={'totalWorth'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" />
                }
                {
                    showDebt && <Area opacity={actives[keyNames["debt"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["debt"]} yAxisId="left" type="monotone" dataKey={'debt'} stroke={themeStyles.colors.warning} dot={false} fillOpacity={0.5} fill="url(#warning-gradient)" />
                }
                {/* <Area opacity={actives[keyNames["worth"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["worth"]} yAxisId="left" type="monotone" dataKey={'worth'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" /> */}
                {/* <Area opacity={actives[keyNames["estimatedStakedBonusUsd"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["estimatedStakedBonusUsd"]} yAxisId="left" type="monotone" dataKey={'estimatedStakedBonusUsd'} stroke={themeStyles.colors.mainTextColor} dot={false} fillOpacity={0.5} fill="url(#primary-gradient)" /> */}
                {/* <Area opacity={actives[keyNames["claimsUsd"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["claimsUsd"]} yAxisId="left" type="monotone" dataKey={'claimsUsd'} stroke={themeStyles.colors.mainTextColor} dot={false} fillOpacity={0.5} fill="url(#primary-gradient)" /> */}
                <Line opacity={actives[keyNames["histoPrice"]] ? 1 : 0} strokeWidth={2} name={keyNames["histoPrice"]} yAxisId="right" type="monotone" dataKey="histoPrice" stroke={themeStyles.colors.info} dot={false} />
                {/* <Line opacity={actives[keyNames["dbrPrice"]] ? 1 : 0} strokeWidth={2} name={keyNames["dbrPrice"]} yAxisId="right" type="monotone" dataKey="dbrPrice" stroke={themeStyles.colors.info} dot={false} /> */}
                {
                    showEvents && data
                        .filter(d => d.isClaimEvent)
                        .map(d => {
                            return <ReferenceLine position="start" isFront={true} yAxisId="left" x={d.timestamp}
                                stroke={LABEL_COLORS[d.eventName]}
                                strokeDasharray={EVENT_DASHES[d.eventName]}
                                label={!showEventsLabel ? undefined : { value: 'Claim', position: LABEL_POSITIONS[d.eventName], fill: LABEL_COLORS[d.eventName] }}
                            />
                        })
                }
                {
                    showEvents && data
                        .filter(d => !d.isClaimEvent && d.isEvent)
                        .map(d => {
                            return <ReferenceLine position="start" isFront={true} yAxisId="left" x={d.timestamp}
                                stroke={LABEL_COLORS[d.eventName]}
                                strokeDasharray={EVENT_DASHES[d.eventName]}
                                strokeWidth={`${(EVENT_WIDTHS[d.eventName] || 2)}px`}
                                label={!showEventsLabel ? undefined : { value: d.eventName, position: LABEL_POSITIONS[d.eventName], fill: LABEL_COLORS[d.eventName] }}
                            />
                        })
                }
                <Brush onChange={handleBrush} startIndex={brushIndexes.startIndex} endIndex={brushIndexes.endIndex} dataKey="timestamp" height={30} stroke="#8884d8" tickFormatter={(v) => ''} />
            </ComposedChart>
        </VStack>
    </Container>
}