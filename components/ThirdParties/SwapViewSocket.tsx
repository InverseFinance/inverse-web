import SocketBridge from "./Socket"
import { CHAIN_TOKENS, getToken } from "@app/variables/tokens";

const DOLA = getToken(CHAIN_TOKENS['1'], 'DOLA')!;
const DOLA_OP = getToken(CHAIN_TOKENS['10'], 'DOLA')!;

export const SwapViewSocket = ({
    fromToken = DOLA.address,
    toToken = DOLA_OP.address,
    fromChainId = 1,
    toChainId = 10,
}: {
    fromToken: string,
    toToken: string,
    fromChainId: number,
    toChainId: number,
}) => {
    return <SocketBridge
        defaultSourceNetwork={fromChainId}
        defaultDestNetwork={toChainId}
        enableSameChainSwaps={true}
        defaultSourceToken={fromToken}
        defaultDestToken={toToken}
    />
}