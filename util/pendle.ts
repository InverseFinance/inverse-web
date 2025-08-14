import { ALE_V3, BURN_ADDRESS } from "@app/config/constants";

import useSWR from "swr";

export const PENDLE_HELPER = '0x4809fE7d314c2AE5b2Eb7fa19C1B166434D29141';

// list of active markets: https://api-v2.pendle.finance/core/v1/1/markets/active
// ptToken => ptMarketAddress
export const ptMarkets = {
    '0xE00bd3Df25fb187d6ABBB620b3dfd19839947b81': '0xcdd26eb5eb2ce0f203a84553853667ae69ca29ce',
    '0xb7de5dFCb74d25c2f21841fbd6230355C50d9308': '0xb162b764044697cf03617c2efbcb1f42e31e4766',
    '0x3b3fB9C57858EF816833dC91565EFcd85D96f634': '0x4339ffe2b7592dc783ed13cce310531ab366deac',
    '0x9F56094C450763769BA0EA9Fe2876070c0fD5F77': '0xa36b60a14a1a5247912584768c6e53e1a269a9f7',
}

// ptToken => ytToken
export const ytTokens = {
    '0xE00bd3Df25fb187d6ABBB620b3dfd19839947b81': '0x96512230bf0fa4e20cf02c3e8a7d983132cd2b9f',
    '0xb7de5dFCb74d25c2f21841fbd6230355C50d9308': '0x1de6ff19fda7496ddc12f2161f6ad6427c52abbe',
    '0x3b3fB9C57858EF816833dC91565EFcd85D96f634': '0xb7e51d15161c49c823f3951d579ded61cd27272b',
    '0x9F56094C450763769BA0EA9Fe2876070c0fD5F77': '0x029d6247adb0a57138c62e3019c92d3dfc9c1840',
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

// give slippage in percentage, if 1% slippage, give 1, will be converted to 0.01 for the api
// if expired: redeem case, if not expired: swap case
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
    const receiver = isLeverageCase ? PENDLE_HELPER : ALE_V3;
    const baseUrl = isExpired ? 'https://api-v2.pendle.finance/core/v1/sdk/1/redeem' : `https://api-v2.pendle.finance/core/v1/sdk/1/markets/${ptMarketAddress.toLowerCase()}/swap`;
    const slippage = (parseFloat(slippagePercentage)/100).toFixed(3);
    let queryParams = `receiver=${receiver}&slippage=${slippage}&enableAggregator=true&tokenOut=${buyToken}&amountIn=${sellAmount}`;

    if(isExpired) {
        const ytToken = ytTokens[buyToken] || ytTokens[sellToken];
        queryParams = queryParams + `&yt=${ytToken}`;
    }
    else {
        queryParams = queryParams + `&tokenIn=${sellToken}`;
    }

    const responseData = await fetch(`${baseUrl}?${queryParams}`).then(r => r.json());

    const hasError = !!responseData.error;

    return {
        error: hasError,
        msg: hasError ? responseData?.message || 'Unknown error' : undefined,
        buyAmount: responseData?.data?.amountOut || '0',
        data: responseData?.tx?.data || '0x',
        gasPrice: responseData?.tx?.gasPrice || '0',
        to: responseData?.tx?.to || '0x',
        receiver,
        baseUrl,
    };
}
