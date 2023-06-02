import SocketBridge from "./Socket"
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";

export const SwapViewSocket = ({
    fromToken = 'DOLA',
    toToken = 'INV',
    fromChainId = 1,
    toChainId = 1,
}: {
    fromToken: string,
    toToken: string,
    fromChainId: number,
    toChainId: number,
}) => {

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