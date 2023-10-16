import { UnderlyingItem } from "@app/components/common/Assets/UnderlyingItem"
import { Token } from "@app/types"
import { EthXe } from "@app/util/enso"
import { getBnToNumber, shortenNumber, smartShortNumber } from "@app/util/markets"
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack } from "@chakra-ui/react"
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
    isLoading = false
}: {
    chainId: string
    amountOut: string
    targetAsset: Token
    targetChainId: string
    routes: EnsoRoute[]
    priceImpactBps: number | null
    isLoading: boolean
}) => {
    const [showActions, setShowActions] = useState(false);
    const isPriceImpactUnknown = typeof priceImpactBps !== 'number';
    return <VStack w='full' alignItems="flex-start">
        <HStack w='full' justify="space-between" spacing="1">
            <HStack textDecoration="underline" cursor="pointer" onClick={() => setShowActions(!showActions)}>
                <Text fontWeight="bold">Actions</Text>
                {showActions ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </HStack>
            <HStack>
                <Text>Price impact:</Text>
                <Text fontWeight="bold" color={isPriceImpactUnknown || priceImpactBps >= 200 ? 'error' : priceImpactBps < 100 ? 'success' : 'warning'}>{isPriceImpactUnknown ? 'Unknown (not recommended to zap)' : `${shortenNumber(priceImpactBps / 100, 2)}%`}</Text>                
            </HStack>
            {/* <HStack>
                <Text>Result:</Text>
                <Text>{`~${smartShortNumber(getBnToNumber(parseUnits(amountOut, 0), targetAsset.decimals))} ${targetAsset.name}`}</Text>
            </HStack> */}
        </HStack>
        {showActions && routes.map((r, i) => {
            const inTokens = r.tokenIn.map(t => getTokenObjectFromPosition(chainId, t)).flat();
            const outTokens = r.tokenOut.map(t => getTokenObjectFromPosition(targetChainId, t)).flat();
            return <HStack key={`${r.action}-${r.protocol}-${i}`}>
                <HStack spacing="0">
                    <HStack spacing="1">
                        {/* <Text w='160px' fontWeight="bold" textTransform="capitalize">{r.protocol}:</Text> */}
                        <Text w='80px' textTransform="capitalize">
                            {r.action}
                        </Text>
                    </HStack>
                    {/* <HStack spacing="1">
                        <HStack spacing="0">
                            {inTokens.map(token => <UnderlyingItem {...token} protocolImage={undefined} />)}
                        </HStack>
                        {
                            <>
                                <Text>=></Text>
                                <HStack spacing="0">
                                    {outTokens.map(token => <UnderlyingItem {...token} protocolImage={undefined} showAsLp={token.isLP} />)}
                                </HStack>
                            </>
                        }
                    </HStack> */}
                </HStack>
            </HStack>
        })}
    </VStack>
}