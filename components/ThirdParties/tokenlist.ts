import { CHAIN_TOKENS } from "@app/variables/tokens"

// specific format for bridging
const entries = Object.entries(CHAIN_TOKENS);
const orders = {
    "DOLA": 1,
    "INV": 2,
    "DBR": 3,
}
export const MAIN_TOKENS_ARRAY = entries.flatMap(([chainId, chainList]) => {
    const tokens = Object.values(chainList)
        .filter(token => ['INV', 'DOLA', 'DBR', 'USDC', 'USDT', 'DAI', 'WETH', 'FRAX', 'WBTC', 'MATIC', 'OP', 'ARB', 'BNB', 'ETH'].includes(token.symbol)
        );
    return tokens.map(token => {
        return {
            chainId: parseInt(chainId),
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            logoURI: token.image,
            order: orders[token.symbol] ?? Infinity
        }
    });
}).sort((a, b) => a.order - b.order);

export const EXTENDED_TOKENS_ARRAY = MAIN_TOKENS_ARRAY.concat([])
