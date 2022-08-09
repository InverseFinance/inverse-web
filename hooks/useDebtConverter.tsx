import { SWR } from '@app/types'
import useEtherSWR from './useEtherSWR'
import { getNetworkConfigConstants } from '@app/util/networks';
import { getBnToNumber } from '@app/util/markets'
import { useContractEvents } from './useContractEvents';
import { DEBT_CONVERTER_ABI } from '@app/config/abis';
import { DebtRepayment, DebtConversion } from '@app/types';
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

    const [exRateData, repaymentEpoch, totalRedeemableDola] = data || [null, null, null];

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
    const { exchangeRate, repaymentEpoch } = useDebtConverter(account);

    const { events } = useContractEvents(DEBT_CONVERTER, DEBT_CONVERTER_ABI, 'Conversion', [account]);

    const repaymentsEpochs = [...Array(repaymentEpoch).keys()];
    const { data: currentlyRedeemableData, error } = useEtherSWR(
        events?.map((e, i) => {
            return repaymentsEpochs.map(epochIndex => [DEBT_CONVERTER, 'getRedeemableDolaIOUsFor', account, i, epochIndex]);
        }).flat(),
    );

    const currentlyRedeemable = repaymentEpoch && currentlyRedeemableData ?
        events?.map((e, i) => {
            return repaymentsEpochs
            .map(epochIndex => getBnToNumber(currentlyRedeemableData[i + epochIndex]))
            .reduce((prev, curr) => prev + curr, 0);
        }) :
        events?.map(e => 0);

    const { data, error: conversionsError } = useEtherSWR([
        ...events?.map((e, i) => [DEBT_CONVERTER, 'conversions', account, i]),
    ]);

    return {
        conversions: !!events && !!data && !!currentlyRedeemable && !!exchangeRate ? events.map((e, i) => {
            const conversion = data[i];
            const redeemableIOUs = getBnToNumber(conversion.dolaIOUAmount);
            const redeemedIOUs = getBnToNumber(conversion.dolaIOUsRedeemed);
            const currentlyRedeemableIOUs = currentlyRedeemable[i];
            const lastEpochRedeemed = getBnToNumber(conversion.lastEpochRedeemed, 0);
            const leftToRedeem = redeemableIOUs - redeemedIOUs;
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
                leftToRedeem,
                currentlyRedeemableDOLAs: currentlyRedeemableIOUs * exchangeRate,
                redeemablePerc: leftToRedeem ? (currentlyRedeemableIOUs / leftToRedeem) * 100 : 0,
                redeemedPerc: (redeemedIOUs / redeemableIOUs) * 100,
            }
        }) : [],
        isLoading: !data && !events && !currentlyRedeemable,
        isError: !!error || !!conversionsError,
    }
}

export const useDebtRepayments = (): SWR & {
    repayments: DebtRepayment[],
    isLoading: boolean,
} => {

    const { events, error } = useContractEvents(DEBT_CONVERTER, DEBT_CONVERTER_ABI, 'Repayment');

    return {
        repayments: !!events ? events.map((e) => {
            return {
                txHash: e.transactionHash,
                blocknumber: e.blockNumber,
                dolaAmount: getBnToNumber(e.args.dolaAmount),
                epoch: getBnToNumber(e.args.epoch, 0),
            }
        }) : [],
        isLoading: !events,
        isError: !!error,
    }
}

