import { Market, SWR } from '@app/types'
import useEtherSWR from './useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'

const { DEBT_REPAYER } = getNetworkConfigConstants();

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
        discounts: discounts ? discounts.map(b => getBnToNumber(b)) : [],
        remainingDebts: remainingDebts ? remainingDebts.map((b, i) => getBnToNumber(b, markets[i].underlying.decimals)) : [],
        isLoading: !discounts && !remainingDebts && !error,
        isError: !!error,
    }
}