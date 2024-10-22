import { UnderlyingItem } from "@app/components/common/Assets/UnderlyingItem"
import { Token } from "@app/types"
import { EthXe } from "@app/util/enso"
import { getBnToNumber, shortenNumber, smartShortNumber } from "@app/util/markets"
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack, Stack } from "@chakra-ui/react"
import { parseUnits } from "@ethersproject/units"
import { useState } from "react"

type Route = {
    action: string
    protocol: string
    tokenIn: string[]
    tokenOut: string[]
    positionInId: string[]
    positionOutId: string[]
}

type EnsoRoute = Route & {
    internalRoutes?: Route[]
}

const getTokenObjectFromPosition = (chainId: string, address: string) => {
    return address === EthXe ? CHAIN_TOKENS[chainId][address.replace(EthXe, 'CHAIN_COIN')] : getToken(CHAIN_TOKENS[chainId], address);
}

export const EnsoRouting = ({
    chainId,
    targetChainId,
    amountOut,
    targetAsset,
    routes,
    priceImpactBps,
    targetAssetPrice,
    isLoading = false,
}: {
    chainId: string
    amountOut: string
    targetAsset: Token
    targetChainId: string
    routes: EnsoRoute[]
    priceImpactBps: number | null
    isLoading: boolean
    targetAssetPrice: number
}) => {
    const [showActions, setShowActions] = useState(false);
    const isPriceImpactUnknown = typeof priceImpactBps !== 'number';

    return <VStack w='full' alignItems="flex-start">
        {
            priceImpactBps >= 150 && <HStack>
                <Text>Price impact:</Text>
                <Text fontWeight="bold" color={isPriceImpactUnknown || priceImpactBps >= 200 ? 'warning' : priceImpactBps < 100 ? 'success' : 'warning'}>
                    {isPriceImpactUnknown ? 'Unknown' : `${shortenNumber(priceImpactBps / 100, 2)}%`}
                </Text>
            </HStack>
        }
        <HStack w='full' justify="space-between" spacing="1">
            <Stack direction={{ base: 'column', sm: 'row' }}>
                <Text>Result:</Text>
                <Text fontWeight="bold">
                    {`~${smartShortNumber(getBnToNumber(parseUnits(amountOut, 0), targetAsset.decimals), 6)} ${targetAsset.name}`}
                    {targetAssetPrice ? ` (${smartShortNumber(getBnToNumber(parseUnits(amountOut, 0), targetAsset.decimals) * targetAssetPrice, 2, true)})` : ''}
                </Text>
            </Stack>
        </HStack>
        <HStack textDecoration="underline" cursor="pointer" onClick={() => setShowActions(!showActions)}>
            <Text fontWeight="bold">Actions ({routes?.length})</Text>
            {showActions ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </HStack>
        {showActions && routes.map((r, i) => {
            const inTokens = r.tokenIn.map(t => getTokenObjectFromPosition(chainId, t)).flat();
            const outTokens = r.tokenOut.map(t => getTokenObjectFromPosition(targetChainId, t)).flat();
            return <HStack key={`${r.action}-${r.protocol}-${i}`}>
                <VStack spacing="2" alignItems="flex-start">
                    <HStack spacing="1">
                        <Text w='240px' fontWeight="bold" textTransform="capitalize">- {r.protocol} ({r.action}):</Text>
                        {/* <Text w='80px' textTransform="capitalize" fontWeight="bold">
                            {r.action}
                        </Text> */}
                    </HStack>
                    <HStack spacing="1" pl="4">
                        <HStack spacing="0">
                            {inTokens.map(token => <UnderlyingItem alternativeLpDisplay={true} imgContainerProps={{ mr: '2' }}   {...token} label={token.symbol} protocolImage={token.protocolImage} showAsLp={token.isLP} />)}
                        </HStack>
                        {
                            <>
                                <Text>=></Text>
                                <HStack spacing="0">
                                    {outTokens.map(token => <UnderlyingItem alternativeLpDisplay={true} imgContainerProps={{ mr: '2' }}  {...token} label={token.symbol} protocolImage={token.protocolImage} showAsLp={token.isLP} />)}
                                </HStack>
                            </>
                        }
                    </HStack>
                </VStack>
            </HStack>
        })}
    </VStack>
}