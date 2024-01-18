import { DOLA_SAVINGS_ABI, SDOLA_ABI, SDOLA_HELPER_ABI } from "@app/config/abis";
import { BURN_ADDRESS, ONE_DAY_MS, WEEKS_PER_YEAR } from "@app/config/constants";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getBnToNumber } from "./markets";
import { useAccount } from "@app/hooks/misc";

export const DOLA_SAVINGS_ADDRESS = '0x3C2BafebbB0c8c58f39A976e725cD20D611d01e9';
export const SDOLA_ADDRESS = '0x5f246ADDCF057E0f778CD422e20e413be70f9a0c';
export const SDOLA_HELPER_ADDRESS = '0xaD82Ecf79e232B0391C5479C7f632aA1EA701Ed1';

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

export const stakeDolaToSavings = async (signerOrProvider: JsonRpcSigner, dolaIn: BigNumber, recipient?: string) => {
    const contract = getDolaSavingsContract(signerOrProvider);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    return contract.stake(dolaIn, _recipient);
}

export const unstakeDolaFromSavings = async (signerOrProvider: JsonRpcSigner, dolaIn: BigNumber, recipient?: string) => {
    const contract = getDolaSavingsContract(signerOrProvider);
    return contract.unstake(dolaIn);
}

export const dsaClaimRewards = async (signerOrProvider: JsonRpcSigner, recipient?: string) => {
    const contract = getDolaSavingsContract(signerOrProvider);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    return contract.claim(_recipient);
}

export const sdolaDevInit = async (signerOrProvider: JsonRpcSigner) => {
    const contract = getDolaSavingsContract(signerOrProvider);
    // const sdolaContract = getSdolaContract(signerOrProvider);
    // await sdolaContract.setTargetK('150000000000000000000');
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

export const useDSABalance = (account: string, ad = DOLA_SAVINGS_ADDRESS) => {
    const { data, error } = useEtherSWR([ad, 'balanceOf', account]);    
    return {
        bnBalance: data || BigNumber.from('0'),
        balance: data ? getBnToNumber(data) : 0,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}

export const useStakedDola = (dbrDolaPrice: number, supplyDelta = 0): {
    totalSupply: number;
    savingsTotalSupply: number;
    yearlyRewardBudget: number;
    savingsYearlyBudget: number;
    maxYearlyRewardBudget: number;
    dolaBalInDsaFromSDola: number;
    maxRewardPerDolaMantissa: number;
    weeklyRevenue: number;
    pastWeekRevenue: number;
    sDolaDsaShare: number;
    sDolaClaimable: number;
    accountRewardsClaimable: number;
    dbrRatePerDola: number;
    apr: number | null;
    projectedApr: number | null;
    savingsApr: number | null;
    isLoading: boolean;
    hasError: boolean;
} => {
    const account = useAccount();
    const { data: savingsData } = useEtherSWR([
        [DOLA_SAVINGS_ADDRESS, 'claimable', SDOLA_ADDRESS],
        [DOLA_SAVINGS_ADDRESS, 'claimable', account],
        [DOLA_SAVINGS_ADDRESS, 'balanceOf', SDOLA_ADDRESS],
    ]);
    
    const { data: savingsTotalSupplyData } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'totalSupply'],
    );   
    const { data: totalSupplyData, error } = useEtherSWR(
        [SDOLA_ADDRESS, 'totalSupply']
    );    

    const { data: yearlyRewardBudgetData, error: yearlyRewardBudgetErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'yearlyRewardBudget']
    );
    
    const { data: maxYearlyRewardBudgetData, error: maxYearlyRewardBudgetErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'maxYearlyRewardBudget']
    );
    const { data: maxRewardPerDolaMantissaData, error: maxRewardPerDolaMantissaErr } = useEtherSWR(
        [DOLA_SAVINGS_ADDRESS, 'maxRewardPerDolaMantissa']
    );    
    const savingsTotalSupply = (savingsTotalSupplyData ? getBnToNumber(savingsTotalSupplyData) : 0) + supplyDelta;
    const totalSupply = (totalSupplyData ? getBnToNumber(totalSupplyData) : 0) + supplyDelta;        
    const dolaBalInDsaFromSDola = savingsData ? getBnToNumber(savingsData[2]) : 0;
    const sDolaDsaShare = savingsTotalSupply > 0 ? dolaBalInDsaFromSDola / savingsTotalSupply : 1;    
    const d = new Date();
    const weekFloat = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / (ONE_DAY_MS * 7);
    const weekIndexUtc = Math.floor(weekFloat);
    const nextWeekIndexUtc = weekIndexUtc+1;
    const remainingWeekPercToStream = nextWeekIndexUtc - weekFloat;
    const { data: weeklyRevenueData, error: weeklyRevenueErr } = useEtherSWR(
        [SDOLA_ADDRESS, 'weeklyRevenue', weekIndexUtc]
    );
    const { data: pastWeekRevenueData, error: pastWeekRevenueErr } = useEtherSWR(
        [SDOLA_ADDRESS, 'weeklyRevenue', weekIndexUtc - 1]
    );    
    const savingsYearlyBudget = yearlyRewardBudgetData ? getBnToNumber(yearlyRewardBudgetData) : 0;
    const yearlyRewardBudget = sDolaDsaShare > 0 ? savingsYearlyBudget * sDolaDsaShare : savingsYearlyBudget;
    const maxYearlyRewardBudget = maxYearlyRewardBudgetData ? getBnToNumber(maxYearlyRewardBudgetData) : 0;
    const maxRewardPerDolaMantissa = maxRewardPerDolaMantissaData ? getBnToNumber(maxRewardPerDolaMantissaData) : 0;

    // TODO: verify this is correct
    const savingsDbrRatePerDola = savingsTotalSupply > 0 ? Math.min(savingsYearlyBudget / savingsTotalSupply, maxRewardPerDolaMantissa) : maxRewardPerDolaMantissa;    
    const dbrRatePerDola = dolaBalInDsaFromSDola > 0 ? Math.min(yearlyRewardBudget / dolaBalInDsaFromSDola, maxRewardPerDolaMantissa) : maxRewardPerDolaMantissa;

    // weeklyRevenue = in progress
    const weeklyRevenue = weeklyRevenueData ? getBnToNumber(weeklyRevenueData) : 0;
    const pastWeekRevenue = pastWeekRevenueData ? getBnToNumber(pastWeekRevenueData) : 0;
    const remainingRevenueToSteamFromPastWeek = remainingWeekPercToStream * pastWeekRevenue;
    const projectedRevenue = weeklyRevenue + remainingRevenueToSteamFromPastWeek;
    const apr = dolaBalInDsaFromSDola > 0 ? (pastWeekRevenue * WEEKS_PER_YEAR) / dolaBalInDsaFromSDola * 100 : null;
    const projectedApr = dbrDolaPrice ? dbrRatePerDola * dbrDolaPrice * 100 : null;
    const savingsApr = dbrDolaPrice ? savingsDbrRatePerDola * dbrDolaPrice * 100 : null;    

    return {
        totalSupply,
        savingsTotalSupply,
        sDolaDsaShare,
        dbrRatePerDola,
        dolaBalInDsaFromSDola,
        yearlyRewardBudget,
        savingsYearlyBudget,
        maxYearlyRewardBudget,
        maxRewardPerDolaMantissa,
        weeklyRevenue,
        pastWeekRevenue,
        sDolaClaimable: savingsData ? getBnToNumber(savingsData[0]) : 0,
        accountRewardsClaimable: savingsData ? getBnToNumber(savingsData[1]) : 0,
        apr,
        projectedApr,
        savingsApr,
        isLoading: (!totalSupplyData && !error) || (!yearlyRewardBudgetData && !yearlyRewardBudgetErr) || (!maxYearlyRewardBudgetData && !maxYearlyRewardBudgetErr),
        hasError: !!error || !!yearlyRewardBudgetErr || !!maxYearlyRewardBudgetErr,
    }
}