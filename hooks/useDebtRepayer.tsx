import { Market, SWR, Token } from '@app/types'
import useEtherSWR from './useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BigNumber } from 'ethers';

const { DEBT_REPAYER } = getNetworkConfigConstants();
const BASELINE_DECIMALS = 4;

export const useDebtRepayer = (markets: Market[]): SWR & {
    remainingDebts: number[],
    discounts: number[],
} => {
    const { data: discounts, error } = useEtherSWR([
        ...markets.map(m => [DEBT_REPAYER, 'currentDiscount', m.token]),
    ])
    const { data: remainingDebts } = useEtherSWR([
        ...markets.map(m => [DEBT_REPAYER, 'remainingDebt', m.token]),
    ])

    return {
        discounts: discounts ? discounts.map(b => getBnToNumber(b, BASELINE_DECIMALS)) : [],
        remainingDebts: remainingDebts ? remainingDebts.map((b, i) => getBnToNumber(b, markets[i].underlying.decimals)) : [],
        isLoading: !discounts && !remainingDebts && !error,
        isError: !!error,
    }
}

export const useMarketDebtRepayer = (market: Market): SWR & {
    remainingDebt: number,
    discount: number,
} => {
    const { data: discount, error } = useEtherSWR([
        DEBT_REPAYER, 'currentDiscount', market.token
    ])
    const { data: remainingDebt } = useEtherSWR([
        DEBT_REPAYER, 'remainingDebt', market.token
    ])

    return {
        discount: discount ? getBnToNumber(discount, BASELINE_DECIMALS) : 0,
        remainingDebt: remainingDebt ? getBnToNumber(remainingDebt, market.underlying.decimals) : 0,
        isLoading: !discount && !remainingDebt && !error,
        isError: !!error,
    }
}

export const useDebtRepayerOutput = (market: Market, amountIn: string | BigNumber, weth: Token): SWR & {
    output: number
} => {
    
    const { data, error } = useEtherSWR([
        DEBT_REPAYER, 'amountOut', market?.token, market?.underlying?.address||weth.address, amountIn||'0'
    ]);

    const [receiveAmount, amount] = data || [BigNumber.from('0'), BigNumber.from('0')];

    return {
        output: data ? getBnToNumber(receiveAmount, market.underlying.decimals) : 0,
        isLoading: !data && !error,
        isError: !!error,
    }
}

export const useConvertToUnderlying = (anToken: string, amount: string | BigNumber): SWR & {
    underlyingBalance: number
} => {
    
    const { data, error } = useEtherSWR([
        DEBT_REPAYER, 'convertToUnderlying', anToken, amount
    ]);

    return {
        underlyingBalance: data || BigNumber.from('0'),
        isLoading: !data && !error,
        isError: !!error,
    }
}