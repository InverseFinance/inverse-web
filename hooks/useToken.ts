import { BigNumber } from "ethers";
import useEtherSWR from "./useEtherSWR";
import { getBnToNumber } from "@app/util/markets";
import { ERC20_ABI } from "@app/config/abis";

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