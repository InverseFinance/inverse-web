import { BigNumber } from "ethers";
import useEtherSWR from "./useEtherSWR";
import { getBnToNumber } from "@app/util/markets";
import { ERC20_ABI } from "@app/config/abis";

export const useTokenBalances = (ads: string[], account: string | undefined) => {
    const decimalArgs = ads.map(ad => {
        return [ad, 'decimals'];
    });
    const balanceArgs = ads.map(ad => {
        return [ad, 'balanceOf', account];
    });

    const { data: decimalData, error: decimalErr } = useEtherSWR({
        abi: ERC20_ABI,
        args: decimalArgs,
    });
    const { data: balanceData, error: balanceErr } = useEtherSWR({
        abi: ERC20_ABI,
        args: balanceArgs,
    });

    return {
        balances: ads.map((ad, i) => {
            return balanceData && decimalData ? { address: ad, balance: getBnToNumber(balanceData[i], decimalData[i]) } : { address: ad, balance: 0 };
        }),
        isLoading: (!balanceData && !balanceErr) || (!decimalData && !decimalErr),
        hasError: (!balanceData && !!balanceErr) || (!decimalData && !!decimalErr),
    };
}

export const useToken = (ad: string, account: string | undefined) => {
    const args = [
        [ad, 'decimals'],
        [ad, 'symbol'],
    ];
    if (!!account) {
        args.push([ad, 'balanceOf', account]);
    }

    const { data, error } = useEtherSWR({
        abi: ERC20_ABI,
        args,
    });

    const [decimals, symbol, bnBalance] = data || [18, '', BigNumber.from('0')];
    return {
        symbol,
        bnBalance: bnBalance,
        balance: data ? getBnToNumber(bnBalance, decimals) : 0,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}

export const useTokenBalanceAndAllowance = (ad: string, account: string | undefined, spender: string | undefined) => {
    const args = [
        [ad, 'decimals'],
        [ad, 'balanceOf', account],
        [ad, 'allowance', account, spender],
    ];

    const { data, error } = useEtherSWR({
        abi: ERC20_ABI,
        args,
    });

    const [decimals, bnBalance, bnAllowance] = data || [18, BigNumber.from('0'), BigNumber.from('0')];
    return {
        bnBalance: bnBalance,
        balance: data ? getBnToNumber(bnBalance, decimals) : 0,
        bnAllowance: bnAllowance,
        allowance: data ? getBnToNumber(bnAllowance, decimals) : 0,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}

export const useBaseToken = (
    adOnBase: string,
    account: string | undefined
) => {
    const args = [
        [adOnBase, 'decimals'],
        [adOnBase, 'symbol'],
    ];
    if (!!account) {
        args.push([adOnBase, 'balanceOf', account]);
    }

    const { data, error } = useEtherSWR({
        abi: ERC20_ABI,
        args,
    });

    const [decimals, symbol, bnBalance] = data || [18, '', BigNumber.from('0')];
    return {
        symbol,
        bnBalance: bnBalance,
        balance: data ? getBnToNumber(bnBalance, decimals) : 0,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}