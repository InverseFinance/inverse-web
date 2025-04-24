import { BURN_ADDRESS } from "@app/config/constants";

import useSWR from "swr";

// list of active markets: https://api-v2.pendle.finance/core/v1/1/markets/active
// ptToken => ptMarketAddress
export const ptMarkets = {
    '0xE00bd3Df25fb187d6ABBB620b3dfd19839947b81': '0xcdd26eb5eb2ce0f203a84553853667ae69ca29ce',
    '0xb7de5dFCb74d25c2f21841fbd6230355C50d9308': '0xb162b764044697cf03617c2efbcb1f42e31e4766',
}

// ptToken => ytToken
export const ytTokens = {
    '0xE00bd3Df25fb187d6ABBB620b3dfd19839947b81': '0x96512230bf0fa4e20cf02c3e8a7d983132cd2b9f',
    '0xb7de5dFCb74d25c2f21841fbd6230355C50d9308': '0x1de6ff19fda7496ddc12f2161f6ad6427c52abbe',
}

// deprecated
export const getUserPtApy = async (ptToken: string, user: string) => {
    try {
        const ptMarketAddress = ptMarkets[ptToken];
        const [yields, pnl] = await Promise.all([
            fetch(`https://api-v2.pendle.finance/bff/v5/1/transactions/${ptMarketAddress}?type=TRADES&action=SHORT_YIELD&skip=0&limit=100&minValue=0&txOrigin=${user}`).then(r => r.json()),
            fetch(`https://api-v2.pendle.finance/pnl/v1/transactions?user=${user}&market=${ptMarketAddress}&chainId=1&limit=100&skip=0`).then(r => r.json()),
        ]);

        const buyPtTxs = pnl.results.filter(r => r.action === 'buyPt').map(r => r.txHash);
        const ptBuys = yields.results.filter(r => buyPtTxs.includes(r.txHash));
        const totalValue = ptBuys.reduce((prev, curr) => prev + (curr.value), 0);
        return ptBuys.reduce((prev, curr) => prev + (curr.value * curr.impliedApy * 100), 0) / totalValue;
    } catch (e) {
        
    }
    return undefined;
}

// deprecated
export const useUserPtApy = (ptToken: string, user: string) => {
    const tsMinute = (new Date()).toISOString().substring(0, 16);
    const { data: userFixedYieldApy, error } = useSWR(`pt-${ptToken}-${user}-${tsMinute}`, async () => {
        return !ptToken || !user || user === BURN_ADDRESS ? Promise.resolve(undefined) : await getUserPtApy(ptToken, user);
    });

    return {
        apy: userFixedYieldApy,
        isLoading: !userFixedYieldApy && !error,
        isError: error,
    }
}

export const useUserPtApys = (ptTokens: string[], user: string) => {
    const tsMinute = (new Date()).toISOString().substring(0, 16);
    const { data: userFixedYieldApys, error } = useSWR(`pt-tokens-${user}-${tsMinute}`, async () => {
        return !user || user === BURN_ADDRESS ? Promise.resolve(undefined) : await Promise.all([
            ptTokens.map(pt => {
                return getUserPtApy(pt, user);
            })
        ]);
    });

    const userFixedYieldApysObj = userFixedYieldApys ? ptTokens.reduce((prev, curr, i) => {
        return {
            ...prev,
            [curr]: userFixedYieldApys[i],
        }
    }, {}) : {};

    return {
        apys: userFixedYieldApysObj,
        isLoading: !userFixedYieldApys && !error,
        isError: error,
    }
}

export const getPendleSwapData = async (
    buyToken: string,
    sellToken: string,
    sellAmount: string,
    slippagePercentage: string,
    isExpired: boolean,
) => {
    const ptMarketAddress = Object.entries(ptMarkets).find(([col, m]) => [buyToken.toLowerCase(), sellToken.toLowerCase()].includes(col.toLowerCase()))[1];
    const isLeverageCase = !!Object.entries(ptMarkets).find(([col, m]) => [buyToken.toLowerCase()].includes(col.toLowerCase()));
    // receiver = helper or ale
    const receiver = isLeverageCase ? '0x4809fE7d314c2AE5b2Eb7fa19C1B166434D29141' : '0x4dF2EaA1658a220FDB415B9966a9ae7c3d16e240';
    const baseUrl = isExpired ? 'https://api-v2.pendle.finance/core/v1/sdk/1/redeem' : `https://api-v2.pendle.finance/core/v1/sdk/1/markets/${ptMarketAddress.toLowerCase()}/swap`;
    let queryParams = `receiver=${receiver}&slippage=${slippagePercentage}&enableAggregator=true&tokenIn=${sellToken}&tokenOut=${buyToken}&amountIn=${sellAmount}`;
    if(isExpired) {
        const ytToken = ytTokens[buyToken] || ytTokens[sellToken];
        queryParams = queryParams + `&yt=${ytToken}`;
    }
    const responseData = await fetch(`${baseUrl}?${queryParams}`).then(r => r.json());
    return {
        buyAmount: responseData.data.amountOut,
        data: responseData.tx.data,
        gasPrice: responseData.tx.gasPrice,
        to: responseData.tx.to,
        receiver,
        baseUrl,
    };
}
