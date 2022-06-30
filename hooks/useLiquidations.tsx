import { LiquidationItem, SWR } from '@app/types';
import { UNDERLYING } from '@app/variables/tokens';
import { useCustomSWR } from './useCustomSWR'

const underlying = Object.entries(UNDERLYING).map(([key, v]) => ({ ...v, ctoken: key.toLowerCase() }))

export const useLiquidations = (borrower?: string): SWR & { liquidations: LiquidationItem[] } => {
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
        isLoading: !data && !error,
        isError: !!error,
    }
}