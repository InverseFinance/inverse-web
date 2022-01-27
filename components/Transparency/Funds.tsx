import { Flex, Image, Text } from '@chakra-ui/react';
import { OLD_XINV } from '@app/config/constants';
import { Prices, Token } from '@app/types';
import { shortenNumber } from '@app/util/markets';

const FundLine = ({ token, value, usdValue, perc, showPerc = true }: { token: Token, value: number, usdValue: number, perc: number, showPerc?: boolean }) => {
    return (
        <Flex direction="row" w='full' alignItems="center" justify="space-between">
            <Flex alignItems="center">
                <Text>-</Text>
                <Image display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' mr="2" ml="1" />
                <Text lineHeight="15px">{token.symbol}{token.address === OLD_XINV && ' (old)'}:</Text>
            </Flex>
            <Flex alignItems="center">
                <Text>
                    {shortenNumber(value, 2, false, true)} ({shortenNumber(usdValue, 2, true, true)})
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

export const Funds = ({
    funds,
    prices,
    totalLabel = '- TOTAL worth in USD:',
    boldTotal = true,
    showPerc = true,
    showTotal = true,
}: {
    prices?: Prices["prices"],
    funds: { token: Token, balance: number, allowance?: number, usdPrice?: number }[],
    totalLabel?: string
    boldTotal?: boolean,
    showPerc?: boolean,
    showTotal?: boolean,
}) => {
    const usdTotals = { balance: 0, allowance: 0, overall: 0 };

    const positiveFunds = (funds || [])
        .map(({ token, balance, allowance, usdPrice }) => {
            const priceKey = token.coingeckoId || token.symbol;
            const price = usdPrice ?? (!!prices && !!priceKey && !!prices[priceKey] && prices[priceKey].usd);
            const usdBalance = price && balance ? balance * price : 0;
            const usdAllowance = price && allowance ? allowance * price : 0;
            const totalBalance = balance || 0 + (allowance || 0)
            const totalUsd = usdBalance + usdAllowance
            usdTotals.balance += usdBalance;
            usdTotals.allowance += usdAllowance;
            usdTotals.overall += totalUsd;
            return { token, balance, allowance, usdBalance, usdAllowance, totalBalance, totalUsd };
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
        .map(({ token, balance, usdBalance, balancePerc }) => {
            return <FundLine key={token.address || token.symbol} token={token} value={balance} usdValue={usdBalance} perc={balancePerc} showPerc={showPerc} />
        })

    const positiveAllowances = fundsWithPerc.filter(({ allowance }) => (allowance || 0) > 0);
    positiveAllowances.sort((a, b) => b.usdAllowance - a.usdAllowance);

    const allowancesContent = positiveAllowances
        .map(({ token, allowance, usdAllowance, allowancePerc }) => {
            return <FundLine key={token.address || token.symbol} token={token} value={allowance!} usdValue={usdAllowance} perc={allowancePerc} showPerc={showPerc} />
        })

    return (
        <>
            {balancesContent}
            {
                positiveAllowances.length > 0 &&
                <Flex direction="row" w='full' justify="space-between">
                    <Text fontWeight="bold">Allowances:</Text>
                </Flex>
            }
            {allowancesContent}
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