import { shortenNumber } from '@app/util/markets';
import { Badge, Box, Image, Text } from '@chakra-ui/react';
import { getNetworkConfigConstants } from '@app/util/networks';

const { TOKENS } = getNetworkConfigConstants();
const chainCoin = TOKENS?.CHAIN_COIN ? TOKENS.CHAIN_COIN.symbol[0] + TOKENS.CHAIN_COIN.symbol.substring(1, 20).toLowerCase() : 'eth';

export const SwapRoute = ({
    label,
    isBestRoute,
    cost,
    ethPriceUsd,
    includeCostInBestRate,
    image,
}: {
    label: string,
    isBestRoute: boolean,
    cost: number,
    ethPriceUsd: number,
    includeCostInBestRate: boolean,
    image: string,
}) => {
    return (
        <Box position="relative" px="3" py="3" w="full" fontSize={{ base: '10px', sm: '14px' }}>
            <Text display={{ base: 'none', sm: 'inline-block' }} fontWeight="bold">Via {label}</Text>
            <Text display={{ sm: 'none' }} fontWeight="bold">{label}</Text>
            <Text mt="1" fontSize={{ base: '10px', sm: '12px' }}>
                Swap Gas Fees:
            </Text>
            <Text fontSize={{ base: '10px', sm: '12px' }}>
                ~{shortenNumber(cost, 4)} {chainCoin}
            </Text>
            <Text fontSize={{ base: '10px', sm: '12px' }}>
                ~{shortenNumber(cost * ethPriceUsd, 2, true)}
            </Text>
            <Image ignoreFallback={true} src={image} h="20px" w="20px" position="absolute" bottom="10px" right="0" borderRadius="20px" />
            {isBestRoute ?
                <Badge
                    bgColor="secondary"
                    textTransform="none"
                    fontSize="12px"
                    color="primary"
                    position="absolute"
                    top="-2"
                    right="-3"
                >
                    Best{includeCostInBestRate ? ' Total ': ' '}Rate
                </Badge> : null
            }
        </Box>
    )
}