import { Flex, Image, Text } from '@chakra-ui/react';
import { OLD_XINV } from '@app/config/constants';
import { Prices, Token } from '@app/types';
import { shortenNumber } from '@app/util/markets';
import { PieChart } from './PieChart';
import { RTOKEN_SYMBOL } from '@app/variables/tokens';

const FundLine = ({ token, value, usdValue, usdPrice, perc, showPerc = true, showPrice = false, label }: { token: Token, value: number, usdPrice: number, usdValue: number, perc: number, showPerc?: boolean, showPrice?: boolean, label?: string }) => {
    return (
        <Flex direction="row" w='full' alignItems="center" justify="space-between">
            <Flex alignItems="center">
                <Text>-</Text>
                {
                    token?.image && <Image display="inline-block" src={token?.image} ignoreFallback={true} w='15px' h='15px' mr="1" ml="1" />
                }
                <Text ml="1" lineHeight="15px">{label||token?.symbol}{token?.address === OLD_XINV && ' (old)'}:</Text>
            </Flex>
            <Flex alignItems="center">
                <Text>
                    {shortenNumber(value, 2, false, true)} {showPrice && `at ${shortenNumber(usdPrice, 2, true)} `}({shortenNumber(usdValue, 2, true, true)})
                </Text>
                {
                    showPerc && <Text ml="2px" minW="53px" textAlign="right" fontWeight='bold'>
                        {shortenNumber(perc, 2, false, true).padStart(5, '  ')}%
                    </Text>
                }
            </Flex>
        </Flex>
    )
}

const getPrice = (prices: Prices["prices"] | undefined, token: Token | undefined) => {
    if(!token){ return 0 }
    const p1 = (!!prices && !!token.symbol && !!prices[token.symbol] && prices[token.symbol].usd);
    const p2 = (!!prices && !!token.coingeckoId && !!prices[token.coingeckoId] && prices[token.coingeckoId].usd);
    return p1 || p2 || 0;
}

type FundsProps = {
    prices?: Prices["prices"],
    funds: { token: Token, balance: number, allowance?: number, usdPrice?: number }[],
    totalLabel?: string
    boldTotal?: boolean,
    showPerc?: boolean,
    showTotal?: boolean,
    chartMode?: boolean,
    showPrice?: boolean
    handleDrill?: (datum: any) => void
};

export const getFundsTotalUsd = (funds, prices, fundsType: 'balance' | 'allowance' | 'both' = 'balance'): number => {
    if (fundsType === 'both') {
        return getFundsTotalUsd(funds, prices, 'balance') + getFundsTotalUsd(funds, prices, 'allowance');
    }
    return (funds || prices).reduce((prev, curr) => {
        const price = curr.usdPrice ?? getPrice(prices, curr.token);
        const value = price && curr[fundsType] ? curr[fundsType] * price : 0;
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
    chartMode = false,
    showPrice = false,
    handleDrill,
}: FundsProps) => {
    const usdTotals = { balance: 0, allowance: 0, overall: 0 };

    const positiveFunds = (funds || [])
        .map(({ token, balance, allowance, usdPrice, ctoken, label, drill }) => {
            const price = usdPrice ?? getPrice(prices, token);
            const usdBalance = price && balance ? balance * price : 0;
            const usdAllowance = price && allowance ? allowance * price : 0;
            const totalBalance = balance || 0 + (allowance || 0)
            const totalUsd = usdBalance + usdAllowance
            usdTotals.balance += usdBalance;
            usdTotals.allowance += usdAllowance;
            usdTotals.overall += totalUsd;
            const _token = ctoken === OLD_XINV ? { ...token, symbol: `${RTOKEN_SYMBOL}-old` } : token;
            return { token: _token, ctoken, balance, allowance, usdBalance, usdAllowance, totalBalance, totalUsd, usdPrice: price, label, drill };
        })
        .filter(({ totalBalance }) => totalBalance > 0)
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
        .map(({ token, balance, usdBalance, balancePerc, usdPrice, ctoken, label }) => {
            return <FundLine key={ctoken || token?.address || label || token?.symbol} label={label} token={token} showPrice={showPrice} usdPrice={usdPrice} value={balance} usdValue={usdBalance} perc={balancePerc} showPerc={showPerc} />
        })

    const positiveAllowances = fundsWithPerc.filter(({ allowance }) => (allowance || 0) > 0);
    positiveAllowances.sort((a, b) => b.usdAllowance - a.usdAllowance);

    const allowancesContent = positiveAllowances
        .map(({ token, allowance, usdAllowance, allowancePerc, usdPrice, ctoken, label }) => {
            return <FundLine key={ctoken || token?.address || label || token?.symbol} label={label} showPrice={showPrice} usdPrice={usdPrice} token={token} value={allowance!} usdValue={usdAllowance} perc={allowancePerc} showPerc={showPerc} />
        })

    return (
        <>
            {
                chartMode ? <PieChart handleDrill={handleDrill} data={
                    fundsWithPerc
                        .filter(({ usdBalance, usdAllowance }) => usdAllowance > 0 || usdBalance > 0)
                        .map(fund => ({ x: fund.label||fund.token?.symbol, y: fund.usdBalance + fund.usdAllowance, perc: fund.overallPerc, fund }))
                } />
                    :
                    <>
                        {
                            positiveBalances.length > 0 && positiveAllowances.length > 0 &&
                            <Flex direction="row" w='full' justify="space-between">
                                <Text fontWeight="bold">Holdings:</Text>
                            </Flex>
                        }
                        {balancesContent}
                        {
                            positiveAllowances.length > 0 &&
                            <Flex direction="row" w='full' justify="space-between">
                                <Text fontWeight="bold">Allowances:</Text>
                            </Flex>
                        }
                        {allowancesContent}
                    </>
            }
            {
                !fundsWithPerc.length ?
                    <Flex direction="row" w='full' justify="space-between">
                        <Text>No funds at the moment</Text>
                    </Flex>
                    :
                    showTotal &&
                    <Flex fontWeight={boldTotal ? 'bold' : undefined} direction="row" w='full' justify="space-between">
                        <Text>{totalLabel}</Text>
                        <Text>{shortenNumber(usdTotals.overall, 2, true, true)}</Text>
                    </Flex>
            }
        </>
    )
}