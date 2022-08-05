import { Market, SWR, Token } from '@app/types'
import useEtherSWR from './useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BigNumber } from 'ethers';

const { DEBT_REPAYER } = getNetworkConfigConstants();

export const useDebtConverter = (): SWR & {
    exchangeRate: number,
    repaymentEpoch: number,
} => {
    const { data, error } = useEtherSWR([
        [DEBT_REPAYER, 'exchangeRateMantissa'],
        [DEBT_REPAYER, 'repaymentEpoch'],
    ])

    const [exRateData, repaymentEpoch] = data || [null, null];

    return {
        exchangeRate: exRateData ? getBnToNumber(exRateData) : 1,
        repaymentEpoch: repaymentEpoch ? getBnToNumber(repaymentEpoch, 0) : 1,
        isLoading: !exRateData && !error,
        isError: !!error,
    }
}
