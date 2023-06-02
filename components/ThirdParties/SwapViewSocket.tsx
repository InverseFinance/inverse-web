import { getNetwork } from "@app/util/networks";
import SocketBridge from "./Socket"
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";

export const SwapViewSocket = ({
    fromToken = 'USDC',
    toToken = 'DOLA',
    fromChain = '1',
    toChain = '1',
}: {
    fromToken: string,
    toToken: string,
    fromChain: string,
    toChain: string,
}) => {
    const fromChainId = parseInt(getNetwork(fromChain)?.codename !== 'unknown' ? getNetwork(fromChain)?.id : 1);
    const toChainId = parseInt(getNetwork(toChain)?.codename !== 'unknown' ? getNetwork(toChain)?.id : 1);
    const _fromToken = fromToken?.startsWith('0x') ? fromToken : getToken(CHAIN_TOKENS[fromChainId], fromToken)?.address;
    const _toToken = toToken?.startsWith('0x') ? toToken : getToken(CHAIN_TOKENS[toChainId], toToken)?.address;
    
    return <SocketBridge
        defaultSourceNetwork={fromChainId}
        defaultDestNetwork={toChainId}
        enableSameChainSwaps={true}
        defaultSourceToken={_fromToken}
        defaultDestToken={_toToken}
    />
}