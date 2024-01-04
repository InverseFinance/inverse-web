import { DOLA_SAVINGS_ABI, SDOLA_ABI, SDOLA_HELPER_ABI } from "@app/config/abis";
import { BURN_ADDRESS, ONE_DAY_MS } from "@app/config/constants";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getBnToNumber } from "./markets";

export const DOLA_SAVINGS_ADDRESS = '0xcb0A9835CDf63c84FE80Fcc59d91d7505871c98B';
export const SDOLA_ADDRESS = '0xFD296cCDB97C605bfdE514e9810eA05f421DEBc2';
export const SDOLA_HELPER_ADDRESS = '0x8b9d5A75328b5F3167b04B42AD00092E7d6c485c';

export const getDolaSavingsContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(DOLA_SAVINGS_ADDRESS, DOLA_SAVINGS_ABI, signerOrProvider);
}

export const getSdolaContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(SDOLA_ADDRESS, SDOLA_ABI, signerOrProvider);
}

export const getSDolaHelperContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(SDOLA_HELPER_ADDRESS, SDOLA_HELPER_ABI, signerOrProvider);
}

export const sellDolaForDbr = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber) => {
    const contract = getSdolaContract(signerOrProvider);
    return contract.buyDBR(dolaToSell, minDbrOut);
}

export const swapExactDolaForDbr = (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber) => {
    const contract = getSDolaHelperContract(signerOrProvider);
    return contract.swapExactDolaForDbr(dolaToSell, minDbrOut);
}

export const swapDolaForExactDbr = (signerOrProvider: JsonRpcSigner, dolaInMax: BigNumber, dbrOut: BigNumber) => {
    const contract = getSDolaHelperContract(signerOrProvider);
    return contract.swapDolaForExactDbr(dbrOut, dolaInMax);
}

export const getDbrOut = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber) => {
    const contract = getSDolaHelperContract(signerOrProvider);
    return contract.getDbrOut(dolaToSell);
}

export const stakeDola = async (signerOrProvider: JsonRpcSigner, dolaIn: BigNumber, recipient?: string) => {
    const contract = getSdolaContract(signerOrProvider);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    return contract.deposit(dolaIn, _recipient);
}

export const unstakeDola = async (signerOrProvider: JsonRpcSigner, dolaIn: BigNumber, recipient?: string) => {
    const contract = getSdolaContract(signerOrProvider);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    const owner = (await signerOrProvider.getAddress())
    return contract.withdraw(dolaIn, _recipient, owner);
}

export const sdolaDevInit = async (signerOrProvider: JsonRpcSigner) => {
    const contract = getDolaSavingsContract(signerOrProvider);
    await contract.setMaxYearlyRewardBudget('9000000000000000000000000');
    await contract.setMaxRewardPerDolaMantissa('1000000000000000000');
    await contract.setYearlyRewardBudget('6000000000000000000000000');
}

export const useStakedDolaBalance = (account: string, ad = SDOLA_ADDRESS) => {
    const { data, error } = useEtherSWR([ad, 'balanceOf', account]);
    return {
        bnBalance: data || BigNumber.from('0'),
        balance: data ? getBnToNumber(data) : 0,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}

export const useStakedDola = (): {
    totalSupply: number;
    yearlyRewardBudget: number;
    maxYearlyRewardBudget: number;
    maxRewardPerDolaMantissa: number;
    weeklyRevenue: number;
    pastWeekRevenue: number;
    isLoading: boolean;
    hasError: boolean;
} => {
    const { data: totalSupply, error } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'totalSupply']
    );
    const { data: yearlyRewardBudget, error: yearlyRewardBudgetErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'yearlyRewardBudget']
    );
    const { data: maxYearlyRewardBudget, error: maxYearlyRewardBudgetErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'maxYearlyRewardBudget']
    );
    const { data: maxRewardPerDolaMantissa, error: maxRewardPerDolaMantissaErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'maxRewardPerDolaMantissa']
    );
    const d = new Date();
    const weekIndexUtc = Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / (ONE_DAY_MS * 7));
    const { data: weeklyRevenueData, error: weeklyRevenueErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'weeklyRevenue', weekIndexUtc]
    );
    const { data: pastWeekRevenueData, error: pastWeekRevenueErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'weeklyRevenue', weekIndexUtc - 1]
    );
    return {
        totalSupply: totalSupply ? getBnToNumber(totalSupply) : 0,
        yearlyRewardBudget: yearlyRewardBudget ? getBnToNumber(yearlyRewardBudget) : 0,
        maxYearlyRewardBudget: maxYearlyRewardBudget ? getBnToNumber(maxYearlyRewardBudget) : 0,
        maxRewardPerDolaMantissa: maxRewardPerDolaMantissa ? getBnToNumber(maxRewardPerDolaMantissa) : 0,
        weeklyRevenue: weeklyRevenueData ? getBnToNumber(weeklyRevenueData) : 0,
        pastWeekRevenue: pastWeekRevenueData ? getBnToNumber(pastWeekRevenueData) : 0,
        isLoading: (!totalSupply && !error) || (!yearlyRewardBudget && !yearlyRewardBudgetErr) || (!maxYearlyRewardBudget && !maxYearlyRewardBudgetErr),
        hasError: !!error || !!yearlyRewardBudgetErr || !!maxYearlyRewardBudgetErr,
    }
}