import { shortenNumber } from '@app/util/markets';
import { Badge, Box, Text } from '@chakra-ui/react';
import { getNetworkConfigConstants } from '@app/util/networks';

const { TOKENS } = getNetworkConfigConstants();
const chainCoin = TOKENS.CHAIN_COIN.symbol[0] + TOKENS.CHAIN_COIN.symbol.substring(1, 20).toLowerCase();

export const SwapRoute = ({
    label,
    isBestRoute,
    cost,
    ethPriceUsd,
    includeCostInBestRate,
}: {
    label: string,
    isBestRoute: boolean,
    cost: number,
    ethPriceUsd: number,
    includeCostInBestRate: boolean,
}) => {
    return (
        <Box position="relative" px="3" py="3" w="full" fontSize={{ base: '12px', sm: '14px' }}>
            <Text fontWeight="bold">Via {label}</Text>
            <Text mt="1" fontSize="12px">
                Swap Gas Fees:
            </Text>
            <Text fontSize="12px">
                ~{shortenNumber(cost, 4)} {chainCoin}
            </Text>
            <Text fontSize="12px">
                ~{shortenNumber(cost * ethPriceUsd, 2, true)}
            </Text>
            {isBestRoute ?
                <Badge
                    bgColor="secondary"
                    textTransform="none"
                    fontSize="10px"
                    color="primary"
                    position="absolute"
                    top="-1"
                    right="-3"
                >
                    Best{includeCostInBestRate ? ' Total ': ' '}Rate
                </Badge> : null
            }
        </Box>
    )
}