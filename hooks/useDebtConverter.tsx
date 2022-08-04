import { Market, SWR, Token } from '@app/types'
import useEtherSWR from './useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { BigNumber } from 'ethers';

const { DEBT_REPAYER } = getNetworkConfigConstants();

export const useDebtConverter = (): SWR & {
    exchangeRate: number,
} => {
    const { data: exRateData, error } = useEtherSWR([
        [DEBT_REPAYER, 'exchangeRateMantissa']
    ])

    return {
        exchangeRate: exRateData ? getBnToNumber(exRateData) : 1,
        isLoading: !exRateData && !error,
        isError: !!error,
    }
}
