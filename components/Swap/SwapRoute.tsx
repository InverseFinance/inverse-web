import { shortenNumber } from '@app/util/markets';
import { Badge, Box, Text } from '@chakra-ui/react';
import { getNetworkConfigConstants } from '@app/util/networks';

const { TOKENS } = getNetworkConfigConstants();
const chainCoin = TOKENS.CHAIN_COIN.symbol[0]+TOKENS.CHAIN_COIN.symbol.substring(1, 20).toLowerCase();

export const SwapRoute = ({ label, isBestRoute, cost, ethPriceUsd }: { label: string, isBestRoute: boolean, cost: number, ethPriceUsd: number }) => {
    return (
        <Box position="relative" px="3" py="3" fontSize={{ base: '10px', sm: '12px' }}>
            <Text fontWeight="bold">Via {label}</Text>
            <Text mt="1" fontSize="10px">
                Tx. Cost:
            </Text>
            <Text fontSize="10px">
                ~{shortenNumber(cost, 4)} {chainCoin}
            </Text>
            <Text fontSize="10px">
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
                    right="-4"
                >
                    Best Rate
                </Badge> : null
            }
        </Box>
    )
}