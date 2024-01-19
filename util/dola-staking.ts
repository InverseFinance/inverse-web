import { DOLA_SAVINGS_ABI, SDOLA_ABI, SDOLA_HELPER_ABI } from "@app/config/abis";
import { BURN_ADDRESS, ONE_DAY_MS, WEEKS_PER_YEAR } from "@app/config/constants";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { getBnToNumber } from "./markets";
import { useAccount } from "@app/hooks/misc";
import { useCustomSWR } from "@app/hooks/useCustomSWR";

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
    sDolaSupply: number;
    dsaTotalSupply: number;
    yearlyRewardBudget: number;
    dsaYearlyBudget: number;
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
    const { data: apiData, error: apiErr } = useCustomSWR(`/api/dola-staking`);
    const d = new Date();
    const weekFloat = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0) / (ONE_DAY_MS * 7);
    const weekIndexUtc = Math.floor(weekFloat);
  
    const { data: dolaStakingData, error } = useEtherSWR([
        [DOLA_SAVINGS_ADDRESS, 'claimable', SDOLA_ADDRESS],        
        [DOLA_SAVINGS_ADDRESS, 'balanceOf', SDOLA_ADDRESS],
        [DOLA_SAVINGS_ADDRESS, 'totalSupply'],
        [DOLA_SAVINGS_ADDRESS, 'yearlyRewardBudget'],
        [DOLA_SAVINGS_ADDRESS, 'maxYearlyRewardBudget'],
        [DOLA_SAVINGS_ADDRESS, 'maxRewardPerDolaMantissa'],
        [SDOLA_ADDRESS, 'totalSupply'],
        [SDOLA_ADDRESS, 'weeklyRevenue', weekIndexUtc],
        [SDOLA_ADDRESS, 'weeklyRevenue', weekIndexUtc - 1],
        [DOLA_SAVINGS_ADDRESS, 'claimable', account],
    ]);

    return {
        ...formatDolaStakingData(dbrDolaPrice, dolaStakingData, apiData, supplyDelta),
        isLoading: (!dolaStakingData && !error) && (!apiData && !apiErr),
        hasError: !!error || !!apiErr,
    }
}

export const formatDolaStakingData = (
    dbrDolaPrice: number,
    dolaStakingData: any[],
    fallbackData?: any,
    supplyDelta = 0,
) => {
    const sDolaClaimable = dolaStakingData ? getBnToNumber(dolaStakingData[0]) : fallbackData?.sDolaClaimable || 0;    
    const dolaBalInDsaFromSDola = dolaStakingData ? getBnToNumber(dolaStakingData[1]) : fallbackData?.dolaBalInDsaFromSDola || 0;
    const dsaTotalSupply = (dolaStakingData ? getBnToNumber(dolaStakingData[2]) : fallbackData?.dsaTotalSupply || 0) + supplyDelta;    

    const dsaYearlyBudget = dolaStakingData ? getBnToNumber(dolaStakingData[3]) : fallbackData?.dsaYearlyBudget || 0;    
    const maxYearlyRewardBudget = dolaStakingData ? getBnToNumber(dolaStakingData[4]) : fallbackData?.maxYearlyRewardBudget || 0;
    const maxRewardPerDolaMantissa = dolaStakingData ? getBnToNumber(dolaStakingData[5]) : fallbackData?.maxRewardPerDolaMantissa || 0;
    const sDolaSupply = (dolaStakingData ? getBnToNumber(dolaStakingData[6]) : fallbackData?.sDolaSupply || 0) + supplyDelta;
    const weeklyRevenue = dolaStakingData ? getBnToNumber(dolaStakingData[7]) : fallbackData?.weeklyRevenue || 0;
    const pastWeekRevenue = dolaStakingData ? getBnToNumber(dolaStakingData[8]) : fallbackData?.pastWeekRevenue || 0;
    // optional
    const accountRewardsClaimable = dolaStakingData && dolaStakingData[9] ? getBnToNumber(dolaStakingData[9]) : 0;

    const sDolaDsaShare = dsaTotalSupply > 0 ? dolaBalInDsaFromSDola / dsaTotalSupply : 1;
    // sDOLA budget share
    const yearlyRewardBudget = sDolaDsaShare > 0 ? dsaYearlyBudget * sDolaDsaShare : dsaYearlyBudget;
    
    // TODO: verify this is correct
    const savingsDbrRatePerDola = dsaTotalSupply > 0 ? Math.min(dsaYearlyBudget / dsaTotalSupply, maxRewardPerDolaMantissa) : maxRewardPerDolaMantissa;    
    const dbrRatePerDola = dolaBalInDsaFromSDola > 0 ? Math.min(yearlyRewardBudget / dolaBalInDsaFromSDola, maxRewardPerDolaMantissa) : maxRewardPerDolaMantissa;

    const apr = dolaBalInDsaFromSDola > 0 ? (pastWeekRevenue * WEEKS_PER_YEAR) / dolaBalInDsaFromSDola * 100 : null;
    const projectedApr = dbrDolaPrice ? dbrRatePerDola * dbrDolaPrice * 100 : null;
    const savingsApr = dbrDolaPrice ? savingsDbrRatePerDola * dbrDolaPrice * 100 : null;    

    return {
        sDolaSupply,
        dsaTotalSupply,
        sDolaDsaShare,
        dbrRatePerDola,
        dolaBalInDsaFromSDola,
        yearlyRewardBudget,
        dsaYearlyBudget,
        maxYearlyRewardBudget,
        maxRewardPerDolaMantissa,
        weeklyRevenue,
        pastWeekRevenue,
        sDolaClaimable,
        accountRewardsClaimable,
        apr,
        projectedApr,
        savingsApr,
    }
}