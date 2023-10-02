import { useAppTheme } from "@app/hooks/useAppTheme";
import { F2Market } from "@app/types";
import { VStack, Text, FormControl, Switch, Stack, HStack, Popover, PopoverTrigger, PopoverContent } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush, ComposedChart, ReferenceLine } from 'recharts';
import moment from 'moment';
import { shortenNumber, smartShortNumber } from "@app/util/markets";
import { preciseCommify } from "@app/util/misc";
import Container, { AppContainerProps } from "../common/Container";
import { NavButtons } from "../common/Button";
import { lightTheme } from "@app/variables/theme";
import { SkeletonBlob } from "../common/Skeleton";

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

const CHART_TABS = {
    'overview': 'Overview',
    'collateral': 'Collateral balance',
    'debt': 'Debt',
    'invStaking': 'INV anti-dilution',
    'staking': 'Staking rewards',
    'dbrRewards': 'DBR rewards',
    'invDbr': 'INV & DBR',
    'borrowLimit': 'Borrow Limit',
    'collateralFactor': 'Collateral Factor',
}

const Cont = (props: AppContainerProps) => <Container
    p="0"
    noPadding
    {...props}
/>

export const WorthEvoChart = ({
    chartWidth,
    data,
    axisStyle,
    market,
    isLoading,
    walletSupportsEvents,
    priceRef = 'oracleHistoPrice',
}: {
    chartWidth: number,
    data: any[] | null,
    axisStyle?: any,
    market: F2Market,
    isLoading?: boolean,
    walletSupportsEvents?: boolean,
    priceRef?: string,
}) => {
    const { themeStyles, themeName } = useAppTheme();

    const keyNames = {
        'histoPrice': `${market.name} oracle or coingecko price`,
        'oracleHistoPrice': `${market.name} oracle price`,
        'cgHistoPrice': `${market.name} coingecko price`,
        'dbrPrice': 'DBR market price',
        'totalRewardsUsd': 'Total rewards',
        'balanceWorth': 'Collateral balance worth',
        'totalWorth': market.hasClaimableRewards || market.hasStakingLikeRewards ? 'Balance + All Rewards worth' : 'Balance worth',
        'balance': 'Total collateral balance',
        'dbrRewards': 'DBR rewards',
        'rewardsUsd': 'DBR rewards',
        'dbrClaimed': 'DBR claimed',
        'debtUsd': 'DOLA debt',
        'estimatedStakedBonusUsd': market.isInv ? 'INV anti-dilution rewards' : 'Staking earnings',
        'estimatedStakedBonus': market.isInv ? 'INV anti-dilution rewards' : 'Staking earnings',
        'creditWorth': 'Credit Limit',
        'borrowLimit': 'Borrow Limit',
        'collateralFactor': 'Collateral Factor',
    }

    const mainEventColor = themeName === 'light' ? lightTheme.colors.mainTextColor : lightTheme.colors.lightPrimary;
    const stakingColor = themeName === 'light' ? lightTheme.colors.mainTextColor : lightTheme.colors.mainBackgroundColor;
    const totalRewardsColor = themeName === 'light' ? 'darkgreen' : 'lightgreen';
    const stakingGradient = themeName === 'light' ? '#blue-gradient' : '#light-gradient';

    const LABEL_COLORS = {
        'Claim': lightTheme.colors.success,
        'Deposit': mainEventColor,
        'Borrow': lightTheme.colors.accentTextColor,
        'Withdraw': mainEventColor,
        'Repay': lightTheme.colors.accentTextColor,
        'ForceReplenish': lightTheme.colors.error,
        'Liquidate': lightTheme.colors.error,
    };

    const EvoChartEventLegend = () => {
        const eventTypes = Object.keys(EVENT_DASHES)
            .filter(e => market.hasClaimableRewards ? true : e !== 'Claim')
            .sort((a, b) => a < b ? -1 : 1);

        return <VStack alignItems="flex-start">
            {
                eventTypes.map((eventType, i) => {
                    return <HStack spacing="2" key={eventType}>
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

    const tabOptions = [CHART_TABS.overview, CHART_TABS.collateral];
    if (market.isInv) {
        if (walletSupportsEvents) {
            tabOptions.push(CHART_TABS.invDbr);
            tabOptions.push(CHART_TABS.invStaking);
        }
        tabOptions.push(CHART_TABS.dbrRewards);
    } else if (market.hasStakingLikeRewards) {
        tabOptions.push(CHART_TABS.staking);
    }

    const [activeTab, setActiveTab] = useState(CHART_TABS.overview);
    const [useUsd, setUseUsd] = useState(true);
    const [showTotal, setShowTotal] = useState(true);
    const [showCollateral, setShowCollateral] = useState(false);
    const [showCreditWorth, setShowCreditWorth] = useState(false);
    const [showBorrowLimit, setShowBorrowLimit] = useState(false);
    const [showDbr, setShowDbr] = useState(false);
    const [showPrice, setShowPrice] = useState(true);
    const [showDbrPrice, setShowDbrPrice] = useState(false);
    const [showStaking, setShowStaking] = useState(false);
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

    const totalKey = 'totalWorth';
    const totalRewardsUsd = 'totalRewardsUsd';
    const balanceKey = useUsd ? 'balanceWorth' : 'balance';
    const debtKey = useUsd ? 'debtUsd' : 'debt';
    const claimsKey = useUsd ? 'rewardsUsd' : 'dbrRewards';
    const stakingKey = useUsd ? 'estimatedStakedBonusUsd' : 'estimatedStakedBonus';

    useEffect(() => {
        handleTabChange(CHART_TABS.overview);
    }, [])

    const canShowNonUsdAmounts = [CHART_TABS.collateral, CHART_TABS.dbrRewards, CHART_TABS.staking, CHART_TABS.invStaking].includes(activeTab);

    const handleTabChange = (v: string) => {
        if (!canShowNonUsdAmounts && !useUsd) {
            setUseUsd(true);
        }
        setActiveTab(v);
        setShowTotal([CHART_TABS.overview].includes(v));
        setShowCollateral([CHART_TABS.collateral].includes(v));
        setShowCreditWorth([CHART_TABS.borrowLimit].includes(v));
        setShowBorrowLimit([CHART_TABS.borrowLimit].includes(v));
        setShowPrice([CHART_TABS.collateral, CHART_TABS.overview, CHART_TABS.debt, CHART_TABS.invDbr, CHART_TABS.invStaking, CHART_TABS.staking].includes(v));
        setShowDebt(tabOptions.includes(CHART_TABS.debt) && [CHART_TABS.debt, CHART_TABS.overview, CHART_TABS.borrowLimit].includes(v));
        setShowDbr(tabOptions.includes(CHART_TABS.dbrRewards) && [CHART_TABS.dbrRewards, CHART_TABS.invDbr, CHART_TABS.overview].includes(v));
        setShowDbrPrice(tabOptions.includes(CHART_TABS.dbrRewards) && [CHART_TABS.overview, CHART_TABS.dbrRewards, CHART_TABS.invDbr].includes(v));
        setShowStaking((tabOptions.includes(CHART_TABS.staking) || tabOptions.includes(CHART_TABS.invStaking)) && [CHART_TABS.invStaking, CHART_TABS.invDbr, CHART_TABS.staking, CHART_TABS.overview].includes(v));
    }

    const containerLabel = `Your Position Evolution in the ${market.name} Market - Beta`;
    const contProps = {
        label: containerLabel,
        description: market.isInv ? "Historical prices according to the pessimistic oracle (or coingecko if before borrowing was enabled)" : "Historical prices according to the pessimistic oracle",
        // href: market.isInv ? `https://www.coingecko.com/en/coins/${market.underlying.coingeckoId}` : undefined,
    }

    if (isLoading) {
        return <Cont {...contProps}>
            <SkeletonBlob />
        </Cont>
    } else if (!data?.length) {
        return null;
    }

    return <Cont {...contProps}>
        <VStack alignItems="center" maxW={`${chartWidth}px`}>
            <Stack w='full' justify="flex-start" alignItems="flex-start" direction="column">
                <Stack alignItems="center" w='full' spacing={{ base: '2', lg: '4' }} direction={{ base: 'column', lg: 'row' }}>
                    <VStack alignItems="center" maxW={{ base: 'full', sm: '800px' }} w='full'>
                        <NavButtons
                            active={activeTab}
                            options={tabOptions}
                            onClick={(v) => handleTabChange(v)}
                            textProps={{ p: '1', textAlign: 'center', fontSize: { base: '12px', sm: '14px' } }}
                            overflow={{ base: 'scroll', sm: 'auto' }}
                        />
                    </VStack>
                    <HStack h="30px" alignItems="center" spacing="3">
                        {
                            canShowNonUsdAmounts
                            && <FormControl w='fit-content' cursor="pointer" justifyContent="flex-start" display='inline-flex' alignItems='center'>
                                <Text fontSize="12px" whitespace="no-wrap" w='fit-content' mr="1" onClick={() => setUseUsd(!useUsd)}>
                                    Show in USD
                                </Text>
                                <Switch onChange={(e) => setUseUsd(!useUsd)} size="sm" colorScheme="purple" isChecked={useUsd} />
                            </FormControl>
                        }
                        {
                            walletSupportsEvents && <FormControl display={{ base: 'none', sm: 'inline-flex' }} w='fit-content' cursor="pointer" justifyContent="flex-start" alignItems='center'>
                                <Text fontSize="12px" whitespace="no-wrap" w='fit-content' mr="1" onClick={() => setShowEvents(!showEvents)}>
                                    Show events
                                </Text>
                                <Switch onChange={(e) => setShowEvents(!showEvents)} size="sm" colorScheme="purple" isChecked={showEvents} />
                            </FormControl>
                        }
                        <HStack display={{ base: 'none', sm: 'inline-flex' }} cursor="help" visibility={!showEvents ? 'hidden' : 'visible'}>
                            <Popover trigger="hover" placement="right-end">
                                <PopoverTrigger>
                                    <Text fontSize="12px" color={themeStyles.colors.mainTextColorLight2} textDecoration="underline">
                                        See Events Legend
                                    </Text>
                                </PopoverTrigger>
                                <PopoverContent maxW='180px' bgColor="mainBackgroundColor" p="4">
                                    <EvoChartEventLegend />
                                </PopoverContent>
                            </Popover>
                        </HStack>
                    </HStack>
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
                <CartesianGrid fill={themeStyles.colors.accentChartBgColor} stroke="#66666633" strokeDasharray={_axisStyle.grid.strokeDasharray} />
                <XAxis minTickGap={28} interval="preserveStartEnd" style={_axisStyle.tickLabels} dataKey="timestamp" scale="time" type={'number'} allowDataOverflow={true} domain={['dataMin', 'dataMax']} tickFormatter={(v) => {
                    return moment(v).format('MMM Do')
                }} />
                <YAxis style={_axisStyle.tickLabels} yAxisId="left" tickFormatter={(v) => smartShortNumber(v, 2, useUsd)} />
                {
                    showBorrowLimit ?
                        <YAxis domain={[0,100]} style={_axisStyle.tickLabels} yAxisId="right" orientation="right" tickFormatter={(v) => `${shortenNumber(v, 2)}%`} />
                        : <YAxis style={_axisStyle.tickLabels} yAxisId="right" orientation="right" tickFormatter={(v) => shortenNumber(v, 4, true)} />
                }
                <Tooltip
                    wrapperStyle={{ ..._axisStyle.tickLabels }}
                    contentStyle={{ backgroundColor: themeStyles.colors.mainBackgroundColor }}
                    labelFormatter={v => moment(v).format('MMM Do YYYY')}
                    labelStyle={{ fontWeight: 'bold' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value, name) => {
                        const isPrice = [keyNames['histoPrice'], keyNames['cgHistoPrice'], keyNames['oracleHistoPrice']].includes(name);
                        const isPerc = [keyNames['borrowLimit'], keyNames['collateralFactor']].includes(name);
                        return !value ? 'none' : isPerc ? `${shortenNumber(value, 2)}%` : isPrice ? preciseCommify(value, value < 1 ? 4 : 2, true) : preciseCommify(value, !useUsd ? 2 : 0, useUsd)
                    }}
                />
                <Legend wrapperStyle={{
                    ..._axisStyle.tickLabels,
                    fontSize: chartWidth <= 400 ? '12px' : '16px',
                    fontWeight: 'bold',
                }}
                    onClick={toggleChart} style={{ cursor: 'pointer' }} formatter={(value) => value + (actives[value] ? '' : ' (hidden)')} />
                {
                    showTotal && <Area opacity={actives[keyNames[totalKey]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames[totalKey]} yAxisId="left" type="monotone" dataKey={totalKey} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" />
                }
                {
                    showCollateral && <Area opacity={actives[keyNames[balanceKey]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames[balanceKey]} yAxisId="left" type="monotone" dataKey={balanceKey} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" />
                }
                {
                    showCreditWorth && <Area opacity={actives[keyNames['creditWorth']] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames['creditWorth']} yAxisId="left" type="monotone" dataKey={'creditWorth'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" />
                }
                {
                    showDebt && <Area opacity={actives[keyNames[debtKey]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames[debtKey]} yAxisId="left" type="monotone" dataKey={debtKey} stroke={themeStyles.colors.warning} dot={false} fillOpacity={0.5} fill="url(#warning-gradient)" />
                }
                {/* <Area opacity={actives[keyNames["worth"]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames["worth"]} yAxisId="left" type="monotone" dataKey={'worth'} stroke={themeStyles.colors.secondary} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" /> */}
                {
                    showDbr && showStaking && <Area opacity={actives[keyNames[totalRewardsUsd]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames[totalRewardsUsd]} yAxisId="left" type="monotone" dataKey={totalRewardsUsd} stroke={totalRewardsColor} dot={false} fillOpacity={0.5} fill="url(#secondary-gradient)" />
                }
                {
                    showStaking && <Area opacity={actives[keyNames[stakingKey]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames[stakingKey]} yAxisId="left" type="basis" dataKey={stakingKey} stroke={stakingColor} dot={false} fillOpacity={0.5} fill={`url(${stakingGradient})`} />
                }
                {
                    showDbr && <Area opacity={actives[keyNames[claimsKey]] ? 1 : 0} strokeDasharray="4" strokeWidth={2} name={keyNames[claimsKey]} yAxisId="left" type="basis" dataKey={claimsKey} stroke={'gold'} dot={false} fillOpacity={0.5} fill="url(#gold-gradient)" />
                }
                {
                    showBorrowLimit && <Line opacity={actives[keyNames['collateralFactor']] ? 1 : 0} strokeWidth={2} name={keyNames['collateralFactor']} yAxisId="right" type="basis" dataKey={'collateralFactor'} stroke={themeStyles.colors.info} dot={false} />
                }
                {
                    showBorrowLimit && <Line opacity={actives[keyNames['borrowLimit']] ? 1 : 0} strokeWidth={2} name={keyNames['borrowLimit']} yAxisId="right" type="basis" dataKey={'borrowLimit'} stroke={themeStyles.colors.error} dot={false} />
                }
                {
                    showPrice && <Line opacity={actives[keyNames[priceRef]] ? 1 : 0} strokeWidth={2} name={keyNames[priceRef]} yAxisId="right" type="monotone" dataKey={priceRef} stroke={themeStyles.colors.info} dot={false} />
                }
                {
                    showDbrPrice && <Line opacity={actives[keyNames["dbrPrice"]] ? 1 : 0} strokeWidth={2} name={keyNames["dbrPrice"]} yAxisId="right" type="monotone" dataKey="dbrPrice" stroke={'green'} dot={false} />
                }
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
    </Cont>
}