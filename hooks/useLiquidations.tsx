import { LiquidationItem, SWR } from '@app/types';
import { UNDERLYING } from '@app/variables/tokens';
import { useCustomSWR } from './useCustomSWR'
import useStorage from './useStorage';

const underlying = Object.entries(UNDERLYING).map(([key, v]) => ({ ...v, ctoken: key.toLowerCase() }))

export const useLiquidations = (borrower?: string | null): SWR & { liquidations: LiquidationItem[], borrower: string | null | undefined } => {
    const { data, error } = useCustomSWR(`/api/transparency/liquidations?borrower=${borrower || ''}`);

    const liquidations = data?.liquidationEvents ?
        data?.liquidationEvents.map(e => {
            const repaidUnderlying = underlying.find(u => u.ctoken === e.repaidCtoken.toLowerCase());
            const seizedUnderlying = underlying.find(u => u.ctoken === e.seizedCtoken.toLowerCase());
            return {
                ...e,
                txHash: e.id.substring(0, 66),
                repaidAmount: parseFloat(e.underlyingRepayAmount),
                seizedAmount: parseFloat(e.underlyingSeizeAmount),
                repaidUnderlying,
                seizedUnderlying,
            }
        })
        : []

    return {
        liquidations: liquidations,
        borrower: data?.borrower || '',
        isLoading: !data && !error,
        isError: !!error,
    }
}

export const useNbUnseenLiquidations = (account: string | null): number => {
    const { liquidations } = useLiquidations(account);
    const { value } = useStorage(`${account}-seen-liquidations`);
    const seenLiquidations = value || [];
    const nb = liquidations.reduce((prev, curr) => prev + (!seenLiquidations.includes(curr.id) ? 1 : 0), 0)
    return nb;
}