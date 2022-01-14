import { Flex, Image, Text } from '@chakra-ui/react';
import { OLD_XINV } from '@inverse/config/constants';
import { Prices, Token } from '@inverse/types';
import { shortenNumber } from '@inverse/util/markets';

export const Funds = ({ funds, prices }: { prices: Prices["prices"], funds: { token: Token, balance: number }[] }) => {
    const positiveFunds = (funds||[])
        .map(({ token, balance }) => {
            const priceKey = token.coingeckoId || token.symbol;
            const usdBalance = !!prices && !!priceKey && !!prices[priceKey] ? balance * prices[priceKey].usd : 0;
            return { token, balance, usdBalance };
        })
        .filter(({ balance }) => balance > 0)
        .sort((a, b) => b.usdBalance - a.usdBalance)

    let totalUsd = 0;

    const content = positiveFunds
        .map(({ token, balance, usdBalance }) => {
            totalUsd += usdBalance;

            return <Flex key={token.address} direction="row" w='full' alignItems="center" justify="space-between">
                <Flex alignItems="center">
                    <Text>-</Text>
                    <Image display="inline-block" src={token.image} ignoreFallback={true} w='15px' h='15px' mr="2" ml="1" />
                    <Text lineHeight="15px">{token.symbol}{token.address === OLD_XINV && ' (old)'}:</Text>
                </Flex>
                <Text>
                    {shortenNumber(balance, 2, false, true)} ({shortenNumber(usdBalance, 2, true, true)})
                </Text>
            </Flex>
        })

    return (
        <>
            {content}
            {
                !positiveFunds.length ?
                    <Flex direction="row" w='full' justify="space-between">
                        <Text>No funds at the moment</Text>
                    </Flex>
                    :
                    <Flex fontWeight="bold" direction="row" w='full' justify="space-between">
                        <Text>- TOTAL worth in USD:</Text>
                        <Text>{shortenNumber(totalUsd, 2, true, true)}</Text>
                    </Flex>
            }
        </>
    )
}