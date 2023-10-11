import { UnderlyingItem } from "@app/components/common/Assets/UnderlyingItem"
import { EthXe } from "@app/util/enso"
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens"
import { ChevronDownIcon, ChevronRightIcon } from "@chakra-ui/icons"
import { VStack, Text, HStack } from "@chakra-ui/react"
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
    routes
}: {
    chainId: string
    targetChainId: string
    routes: EnsoRoute[]
}) => {
    const [showActions, setShowActions] = useState(false);
    return <VStack w='full' alignItems="flex-start">
        <HStack spacing="1" textDecoration="underline" cursor="pointer" onClick={() => setShowActions(!showActions)}>
            <Text fontWeight="bold">Actions</Text>
            { showActions ? <ChevronDownIcon /> : <ChevronRightIcon /> }
        </HStack>
        {showActions && routes.map((r, i) => {
            const inTokens = r.tokenIn.map(t => getTokenObjectFromPosition(chainId, t));
            const outTokens = r.tokenOut.map(t => getTokenObjectFromPosition(targetChainId, t));
            return <HStack key={`${r.action}-${r.protocol}-${i}`}>
                <HStack spacing="0">
                    <HStack spacing="1">
                        {/* <Text w='160px' fontWeight="bold" textTransform="capitalize">{r.protocol}:</Text> */}
                        <Text w='80px' textTransform="capitalize">
                            {r.action}
                        </Text>
                    </HStack>
                    <HStack spacing="1">
                        <HStack spacing="0">
                            {inTokens.map(token => <UnderlyingItem {...token} protocolImage={undefined} />)}
                        </HStack>
                        {
                            r.action === 'split' && <>
                                <Text>=></Text>
                                <HStack spacing="0">
                                    {outTokens.map(token => <UnderlyingItem {...token} protocolImage={undefined} />)}
                                </HStack>
                            </>
                        }
                    </HStack>
                </HStack>
            </HStack>
        })}
    </VStack>
}