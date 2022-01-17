import { Flex, Image, Text } from '@chakra-ui/react';
import { OLD_XINV } from '@inverse/config/constants';
import { Prices, Token } from '@inverse/types';
import { shortenNumber } from '@inverse/util/markets';

const FundLine = ({ token, value, usdValue }: { token: Token, value: number, usdValue: number }) => {
    return (
        <Flex direction="row" w='full' alignItems="center" justify="space-between">
            <Flex alignItems="center">
                <Text>-</Text>
                <Image display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' mr="2" ml="1" />
                <Text lineHeight="15px">{token.symbol}{token.address === OLD_XINV && ' (old)'}:</Text>
            </Flex>
            <Text>
                {shortenNumber(value, 2, false, true)} ({shortenNumber(usdValue, 2, true, true)})
            </Text>
        </Flex>
    )
}

export const Funds = ({
    funds,
    prices,
    totalLabel = '- TOTAL worth in USD:',
    boldTotal = true,
}: {
    prices: Prices["prices"],
    funds: { token: Token, balance: number, allowance?: number }[],
    totalLabel?: string
    boldTotal?: boolean,
}) => {
    const positiveFunds = (funds || [])
        .map(({ token, balance, allowance }) => {
            const priceKey = token.coingeckoId || token.symbol;
            const usdBalance = !!prices && !!priceKey && !!prices[priceKey] && balance ? balance * prices[priceKey].usd : 0;
            const usdAllowance = !!prices && !!priceKey && !!prices[priceKey] && allowance ? allowance * prices[priceKey].usd : 0;
            const totalBalance = balance || 0 + (allowance || 0)
            const totalUsd = balance || 0 + (allowance || 0)
            return { token, balance, allowance, usdBalance, usdAllowance, totalBalance, totalUsd };
        })
        .filter(({ totalBalance }) => totalBalance > 0)
        .sort((a, b) => b.totalUsd - a.totalUsd)

    let totalUsdWorth = 0;

    const positiveBalances = positiveFunds.filter(({ balance }) => balance > 0);
    positiveBalances.sort((a, b) => b.usdBalance - a.usdBalance);

    const balancesContent = positiveBalances
        .map(({ token, balance, usdBalance }) => {
            totalUsdWorth += usdBalance;
            return <FundLine key={token.address||token.symbol} token={token} value={balance} usdValue={usdBalance} />
        })

    const positiveAllowances = positiveFunds.filter(({ allowance }) => (allowance || 0) > 0);
    positiveAllowances.sort((a, b) => b.usdAllowance - a.usdAllowance);

    const allowancesContent = positiveAllowances
        .map(({ token, allowance, usdAllowance }) => {
            totalUsdWorth += usdAllowance;
            return <FundLine key={token.address||token.symbol} token={token} value={allowance!} usdValue={usdAllowance} />
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
                !positiveFunds.length ?
                    <Flex direction="row" w='full' justify="space-between">
                        <Text>No funds at the moment</Text>
                    </Flex>
                    :
                    <Flex fontWeight={ boldTotal ? 'bold' : undefined } direction="row" w='full' justify="space-between">
                        <Text>{totalLabel}</Text>
                        <Text>{shortenNumber(totalUsdWorth, 2, true, true)}</Text>
                    </Flex>
            }
        </>
    )
}