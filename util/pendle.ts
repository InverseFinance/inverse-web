import { BURN_ADDRESS } from "@app/config/constants";

import useSWR from "swr";

// ptToken => ptMarketAddress
const ptMarkets = {
    '0xE00bd3Df25fb187d6ABBB620b3dfd19839947b81': '0xcdd26eb5eb2ce0f203a84553853667ae69ca29ce',
}

export const getUserPtApy = async (ptToken: string, user: string) => {
    const ptMarketAddress = ptMarkets[ptToken];
    const [yields, pnl] = await Promise.all([
        fetch(`https://api-v2.pendle.finance/bff/v5/1/transactions/${ptMarketAddress}?type=TRADES&action=SHORT_YIELD&skip=0&limit=100&minValue=0&txOrigin=${user}`).then(r => r.json()),
        fetch(`https://api-v2.pendle.finance/pnl/v1/transactions?user=${user}&market=${ptMarketAddress}&chainId=1&limit=100&skip=0`).then(r => r.json()),
    ]);

    const buyPtTxs = pnl.results.filter(r => r.action === 'buyPt').map(r => r.txHash);
    const ptBuys = yields.results.filter(r => buyPtTxs.includes(r.txHash));
    const totalValue = ptBuys.reduce((prev, curr) => prev + (curr.value), 0);
    return ptBuys.reduce((prev, curr) => prev + (curr.value * curr.impliedApy * 100), 0) / totalValue;
}

export const useUserPtApy = (ptToken: string, user: string) => {
    const tsMinute = (new Date()).toISOString().substring(0, 16);
    const { data: userFixedYieldApy, error } = useSWR(`pt-${ptToken}-${user}-${tsMinute}`, async () => {
        return !user || user === BURN_ADDRESS ? Promise.resolve(undefined) : await getUserPtApy(ptToken, user);
    });

    return {
        userFixedYieldApy,
        isLoading: !userFixedYieldApy && !error,
        isError: error,
    }
}
