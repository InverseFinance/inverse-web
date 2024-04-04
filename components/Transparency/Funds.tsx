import { Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { OLD_XINV } from '@app/config/constants';
import { Prices, Token } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { PieChart } from './PieChart';
import { RTOKEN_SYMBOL } from '@app/variables/tokens';
import { MarketImage } from '@app/components/common/Assets/MarketImage';
import { PieChartRecharts } from './PieChartRecharts';
import { useAppTheme } from '@app/hooks/useAppTheme';

const FundLine = ({
    token,
    value,
    usdValue,
    usdPrice,
    perc,
    showPerc = true,
    showPrice = false,
    label,
    showAsAmountOnly,
    noImage = false,
    onlyUsdValue = false,
    leftSideMaxW,
}: {
    token: Token,
    value: number,
    usdPrice: number,
    usdValue: number,
    perc: number,
    showPerc?: boolean,
    showPrice?: boolean,
    label?: string,
    showAsAmountOnly?: boolean
    noImage?: boolean
    onlyUsdValue?: boolean
    leftSideMaxW?: string
}) => {
    const rightSideContent = <>
        <Text textAlign="right">
            {!onlyUsdValue && shortenNumber(value, 2, false, true)} {showPrice && `at ${shortenNumber(usdPrice, 2, true)} `}{!showAsAmountOnly && (!onlyUsdValue ? `(${shortenNumber(usdValue, 2, true, true)})` : shortenNumber(usdValue, 2, true, true))}
        </Text>
        {
            showPerc && <Text ml="2px" minW="53px" textAlign="right" fontWeight='bold'>
                {!!showAsAmountOnly && `  `}{shortenNumber(perc, 2, false, true).padStart(5, '  ')}%
            </Text>
        }
    </>
    const limitLeftSideProps = leftSideMaxW ? { maxW: { lg: leftSideMaxW }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace:{ base: 'normal', lg: 'nowrap' } } : {};
    return (
        <Flex direction="row" w='full' alignItems="center" justify="space-between">
            <Flex alignItems="center">
                <Text>-</Text>
                {
                    !noImage && <MarketImage
                        image={token?.image}
                        protocolImage={token?.protocolImage}
                        isInPausedSection={token?.isInPausedSection || /(-v1|-old)/i.test(token?.symbol)}
                        size={15}
                        mx="1"
                    />
                }
                <Text {...limitLeftSideProps} ml={noImage ? 0 : 1} lineHeight="15px">{label || token?.symbol}{token?.address === OLD_XINV && ' (old)'}</Text>
                <Text>:</Text>
            </Flex>
            {
                !!showAsAmountOnly ? <SimpleGrid w="140px" spacing="1" columns={2} alignItems="center">
                    {rightSideContent}
                </SimpleGrid>
                    :
                    <Flex alignItems="center">
                        {rightSideContent}
                    </Flex>
            }
        </Flex>
    )
}

const getPrice = (prices: Prices["prices"] | undefined, token: Token | undefined) => {
    if (!token) { return 0 }
    const p1 = (!!prices && !!token.symbol && !!prices[token.symbol] && prices[token.symbol].usd);
    const p2 = (!!prices && !!token.coingeckoId && !!prices[token.coingeckoId] && prices[token.coingeckoId].usd);
    return p1 || p2 || 0;
}

export type Fund = {
    token?: Token,
    balance: number,
    allowance?: number,
    usdPrice?: number,
    chartFillColor?: string,
    chartLabelFillColor?: string,
    ctoken?: string,
    label?: string,
    drill?: Fund[],
};

type FundsProps = {
    prices?: Prices["prices"],
    funds: Fund[],
    totalLabel?: string
    boldTotal?: boolean,
    showPerc?: boolean,
    showTotal?: boolean,
    showChartTotal?: boolean,
    labelWithPercInChart?: boolean,
    skipLineForPerc?: boolean,
    chartMode?: boolean,
    showPrice?: boolean
    handleDrill?: (datum: any) => void
    minUsd?: number
    type?: 'both' | 'allowance' | 'balance'
    showAsAmountOnly?: boolean
    noImage?: boolean
    innerRadius?: number
    isLoading?: boolean
    useRecharts?: boolean
    chartProps?: any
    leftSideMaxW?: string
};

export const getFundsTotalUsd = (funds, prices, fundsType: 'balance' | 'allowance' | 'both' = 'balance'): number => {
    if (fundsType === 'both') {
        return getFundsTotalUsd(funds, prices, 'balance') + getFundsTotalUsd(funds, prices, 'allowance');
    }
    return (funds || prices).reduce((prev, curr) => {
        let value;
        if (Array.isArray(curr)) {
            value = getFundsTotalUsd(curr, prices, fundsType);
        } else {
            const price = (curr.usdPrice || curr.price) ?? getPrice(prices, curr.token);
            value = price && curr[fundsType] ? curr[fundsType] * price : 0;
        }
        return prev + value;
    }, 0);
}

export const Funds = ({
    funds,
    prices,
    totalLabel = '- TOTAL worth in USD:',
    boldTotal = true,
    showPerc = true,
    showTotal = true,
    showChartTotal = true,
    labelWithPercInChart = false,
    skipLineForPerc = false,
    chartMode = false,
    showPrice = false,
    handleDrill,
    minUsd = 0,
    type = 'both',
    showAsAmountOnly = false,
    innerRadius,
    noImage = false,
    isLoading,
    chartProps,
    useRecharts = false,
    leftSideMaxW,
}: FundsProps) => {
    const { themeStyles } = useAppTheme();
    const usdTotals = { balance: 0, allowance: 0, overall: 0 };

    const positiveFunds = (funds || [])
        .map(({ token, balance, allowance, usdPrice, price: _price, ctoken, label, drill, chartFillColor, chartLabelFillColor, onlyUsdValue }) => {
            const price = showAsAmountOnly ? 1 : (usdPrice||_price) ?? getPrice(prices, token);
            const usdBalance = price && balance ? balance * price : 0;
            const usdAllowance = price && allowance ? allowance * price : 0;
            const totalBalance = balance || 0 + (allowance || 0);
            const totalUsd = type === 'both' ? usdBalance + usdAllowance : type === 'balance' ? usdBalance : usdAllowance;
            usdTotals.balance += usdBalance;
            usdTotals.allowance += usdAllowance;
            usdTotals.overall += totalUsd;
            const _token = ctoken === OLD_XINV ? { ...token, symbol: `${RTOKEN_SYMBOL}-old` } : token;
            return { token: _token, ctoken, balance, allowance, usdBalance, usdAllowance, totalBalance, totalUsd, usdPrice: price, label, drill, chartFillColor, chartLabelFillColor, onlyUsdValue };
        })
        .filter(({ totalBalance }) => totalBalance > 0)
        .filter(({ totalUsd }) => totalUsd >= minUsd)
        .sort((a, b) => b.totalUsd - a.totalUsd)

    const fundsWithPerc = positiveFunds.map(f => ({
        ...f,
        overallPerc: usdTotals.overall ? f.totalUsd / usdTotals.overall * 100 : 0,
        balancePerc: usdTotals.balance ? f.usdBalance / usdTotals.balance * 100 : 0,
        allowancePerc: usdTotals.allowance ? f.usdAllowance / usdTotals.allowance * 100 : 0,
    }))

    const positiveBalances = fundsWithPerc.filter(({ balance }) => balance > 0);
    positiveBalances.sort((a, b) => b.usdBalance - a.usdBalance);

    const balancesContent = positiveBalances
        .map(({ token, balance, usdBalance, balancePerc, onlyUsdValue, usdPrice, ctoken, label }) => {
            return <FundLine leftSideMaxW={leftSideMaxW} noImage={noImage} onlyUsdValue={onlyUsdValue} key={ctoken || token?.address || label || token?.symbol} showAsAmountOnly={showAsAmountOnly} label={label} token={token} showPrice={showPrice} usdPrice={usdPrice} value={balance} usdValue={usdBalance} perc={balancePerc} showPerc={showPerc} />
        })

    const positiveAllowances = fundsWithPerc.filter(({ allowance }) => (allowance || 0) > 0);
    positiveAllowances.sort((a, b) => b.usdAllowance - a.usdAllowance);

    const allowancesContent = positiveAllowances
        .map(({ token, allowance, usdAllowance, allowancePerc, onlyUsdValue, usdPrice, ctoken, label }) => {
            return <FundLine leftSideMaxW={leftSideMaxW} noImage={noImage} onlyUsdValue={onlyUsdValue} key={ctoken || token?.address || label || token?.symbol} showAsAmountOnly={showAsAmountOnly} label={label} showPrice={showPrice} usdPrice={usdPrice} token={token} value={allowance!} usdValue={usdAllowance} perc={allowancePerc} showPerc={showPerc} />
        })

    const chartData = fundsWithPerc
        .filter(({ usdBalance, usdAllowance }) => (usdAllowance > 0 || usdBalance > 0))
        .map(fund => {
            return {
                x: `${fund.label || fund.token?.symbol}${labelWithPercInChart ? `${skipLineForPerc ? '\r\n' : ' '}${shortenNumber(fund.overallPerc, 2)}%` : ''}`,
                y: fund.totalUsd,
                perc: fund.overallPerc,
                fund,
                fill: fund.chartFillColor,
                labelFill: fund.chartLabelFillColor,
                totalUsd: shortenNumber(usdTotals.overall, 2, true),
                totalBalance: shortenNumber(usdTotals.balance, 2),
            }
        });

    return (
        <>
            {
                chartMode ?
                    useRecharts
                        ?
                        <PieChartRecharts
                            data={chartData}
                            dataKey={'y'}
                            nameKey={'x'}
                            centralNameKey={showAsAmountOnly ? 'totalBalance' : 'totalUsd'}
                            cx="50%"
                            cy="50%"
                            isShortenNumbers={true}
                            isUsd={!showAsAmountOnly}
                            activeFill={themeStyles.colors.mainTextColor}
                            activeTextFill={themeStyles.colors.mainTextColor}
                            activeSubtextFill={themeStyles.colors.mainTextColorLight2}
                            {...chartProps}                            
                        />
                        : <PieChart innerRadius={innerRadius} showTotalUsd={showChartTotal} handleDrill={handleDrill} showAsAmountOnly={showAsAmountOnly}
                            data={chartData}
                            {...chartProps}
                        />
                    :
                    <>
                        {
                            positiveBalances.length > 0 && positiveAllowances.length > 0 && type === 'both' &&
                            <Flex direction="row" w='full' justify="space-between">
                                <Text fontWeight="bold">Holdings:</Text>
                            </Flex>
                        }
                        {['both', 'balance'].includes(type) && balancesContent}
                        {
                            positiveAllowances.length > 0 && ['allowance', 'both'].includes(type) &&
                            <Flex direction="row" w='full' justify="space-between">
                                <Text fontWeight="bold">Allowances:</Text>
                            </Flex>
                        }
                        {['both', 'allowance'].includes(type) && allowancesContent}
                    </>
            }
            {
                !fundsWithPerc.length ?
                    isLoading ? null : <Flex direction="row" w='full' justify="space-between">
                        <Text>No funds at the moment</Text>
                    </Flex>
                    :
                    showTotal &&
                    <Flex fontWeight={boldTotal ? 'bold' : undefined} direction="row" w='full' justify="space-between">
                        <Text>{totalLabel}</Text>
                        <Text>{shortenNumber(usdTotals.overall, 2, !showAsAmountOnly, true)}</Text>
                    </Flex>
            }
        </>
    )
}