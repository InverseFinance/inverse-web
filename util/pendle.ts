import { BURN_ADDRESS } from "@app/config/constants";

import useSWR from "swr";

// ptToken => ptMarketAddress
const ptMarkets = {
    '0xE00bd3Df25fb187d6ABBB620b3dfd19839947b81': '0xcdd26eb5eb2ce0f203a84553853667ae69ca29ce',
}

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

type PendleSwapData = {
    data: {
        amountOut: string;
        priceImpact: number;
    },
    tx: {
        to: string;
        data: string;
        value: string;
    }
}

export const getPendleLeverageUpSwapData = async (ptCollateral: string, dolaToSell: string, slippage: number) => {
    const path = `https://api-v2.pendle.finance/core/v1/sdk/1/markets/${ptMarkets[ptCollateral]}/swap?receiver=0x9844c3688dAaA98De18fBe52499A6B152236896b&slippage=${slippage}&enableAggregator=true&tokenIn=0x865377367054516e17014CcdED1e7d814EDC9ce4&tokenOut=${ptCollateral}&amountIn=${dolaToSell}`
    const res = await fetch(path);
    const result = await res.json();
    return {
        amountOut: result.data.amountOut,
        priceImpact: result.data.priceImpact,
        callData: result.tx.data,
    };
}

export const getPendleLeverageDownSwapData = async (ptCollateral: string, ptToSell: string, slippage: number) => {
    const path = `https://api-v2.pendle.finance/core/v1/sdk/1/markets/${ptMarkets[ptCollateral]}/swap?receiver=0x9844c3688dAaA98De18fBe52499A6B152236896b&slippage=${slippage}&enableAggregator=true&tokenout=0x865377367054516e17014CcdED1e7d814EDC9ce4&tokenIn=${ptCollateral}&amountIn=${ptToSell}`
    const res = await fetch(path);
    const result = await res.json();
    return {
        amountOut: result.data.amountOut,
        priceImpact: result.data.priceImpact,
        callData: result.tx.data,
    };
}