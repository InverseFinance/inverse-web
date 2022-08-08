import { SWR } from '@app/types'
import useEtherSWR from './useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { useContractEvents } from './useContractEvents';
import { DEBT_CONVERTER_ABI } from '@app/config/abis';
import { DebtConversion } from '@app/types';
import { UNDERLYING } from '@app/variables/tokens';

const { DEBT_CONVERTER } = getNetworkConfigConstants();

export const useDebtConverter = (account: string): SWR & {
    exchangeRate: number,
    repaymentEpoch: number,
    totalRedeemableDola: number,
} => {
    const { data, error } = useEtherSWR([
        [DEBT_CONVERTER, 'exchangeRateMantissa'],
        [DEBT_CONVERTER, 'repaymentEpoch'],
        [DEBT_CONVERTER, 'balanceOfDola', account],
    ])

    const [exRateData, repaymentEpoch, totalRedeemableDola] =  data || [null, null, null];

    return {
        exchangeRate: exRateData ? getBnToNumber(exRateData) : 1,
        repaymentEpoch: repaymentEpoch ? getBnToNumber(repaymentEpoch, 0) : 0,
        totalRedeemableDola: totalRedeemableDola ? getBnToNumber(totalRedeemableDola) : 0,
        isLoading: !exRateData && !error,
        isError: !!error,
    }
}

export const useDebtConversions = (account: string): SWR & {
    conversions: DebtConversion[],
    isLoading: boolean,
} => {
    const { exchangeRate } = useDebtConverter(account);    
    const { events } = useContractEvents(DEBT_CONVERTER, DEBT_CONVERTER_ABI, 'Conversion', [account]);
    const { data, error } = useEtherSWR([
        ...events?.map((e, i) => [DEBT_CONVERTER, 'getRedeemableDolaIOUsFor', account, i, e.args.epoch]),
    ]);

    return {
        conversions: !!events && !!data && !!exchangeRate ? events.map((e, i) => {
            const redeemableIOUs = getBnToNumber(data[i]);
            return {
                user: e.args.user,
                anToken: e.args.anToken,
                dolaAmount: getBnToNumber(e.args.dolaAmount),
                underlyingAmount: getBnToNumber(e.args.underlyingAmount, UNDERLYING[e.args.anToken].decimals),
                epoch: getBnToNumber(e.args.epoch, 0),
                conversionIndex: i,
                txHash: e.transactionHash,
                blocknumber: e.blockNumber,
                redeemableIOUs,
                redeemableDolas: redeemableIOUs * exchangeRate,
            }
        }) : [],
        isLoading: !data && !events,
        isError: !!error,
    }
}
