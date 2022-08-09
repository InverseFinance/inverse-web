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
    const { data: currentlyRedeemable, error } = useEtherSWR([
        ...events?.map((e, i) => [DEBT_CONVERTER, 'getRedeemableDolaIOUsFor', account, i, e.args.epoch]),
    ]);
    const { data, error: conversionsError } = useEtherSWR([
        ...events?.map((e, i) => [DEBT_CONVERTER, 'conversions', account, i]),
    ]);

    return {
        conversions: !!events && !!data && !!currentlyRedeemable && !!exchangeRate ? events.map((e, i) => {
            const currentlyRedeemableIOUs = getBnToNumber(currentlyRedeemable[i]);
            const conversion = data[i];
            const redeemableIOUs = getBnToNumber(conversion.dolaIOUAmount);
            const redeemedIOUs = getBnToNumber(conversion.dolaIOUsRedeemed);
            const lastEpochRedeemed = getBnToNumber(conversion.lastEpochRedeemed, 0);
            return {
                user: e.args.user,
                anToken: e.args.anToken,
                dolaAmount: getBnToNumber(e.args.dolaAmount),
                underlyingAmount: getBnToNumber(e.args.underlyingAmount, UNDERLYING[e.args.anToken].decimals),
                epoch: getBnToNumber(e.args.epoch, 0),
                lastEpochRedeemed,
                conversionIndex: i,
                txHash: e.transactionHash,
                blocknumber: e.blockNumber,
                redeemedIOUs,
                currentlyRedeemableIOUs,
                redeemableIOUs,
                redeemableDolas: redeemableIOUs * exchangeRate,
            }
        }) : [],
        isLoading: !data && !events && !currentlyRedeemable,
        isError: !!error || !!conversionsError,
    }
}
