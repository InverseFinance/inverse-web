import { BigNumber, Contract } from "ethers";
import { JDOLA_AUCTION_ABI, JUNIOR_ESCROW_ABI, SDOLA_ABI } from "@app/config/abis";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { parseEther } from "@ethersproject/units";
import { JDOLA_AUCTION_ADDRESS, JUNIOR_ESCROW_ADDRESS, JUNIOR_WITHDRAW_MODEL, ONE_DAY_SECS, WEEKS_PER_YEAR } from "@app/config/constants";
import { aprToApy, getBnToNumber } from "./markets";
import { getLastThursdayTimestamp, getWeekIndexUtc } from "./misc";
import { useAccount } from "@app/hooks/misc";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useCacheFirstSWR } from "@app/hooks/useCustomSWR";
import { useContractEvents } from "@app/hooks/useContractEvents";
import useSWR from "swr";
import { useWeb3React } from "@web3-react/core";

export const getJdolaContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_ABI, signerOrProvider);
}

export const getJuniorEscrowContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signerOrProvider);
}

export const getJuniorWithdrawModelContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(JUNIOR_WITHDRAW_MODEL, ["function getWithdrawDelay(uint totalSupply, uint totalWithdrawing, address withdrawer) external returns(uint)"], signerOrProvider);
}

export const stakeJDola = async (signer: JsonRpcSigner, amount: BigNumber) => {
    const contract = new Contract(JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_ABI, signer);
    return contract.deposit(amount, await signer.getAddress());
}

export const unstakeJDola = async (signer: JsonRpcSigner, amount: BigNumber) => {
    const contract = new Contract(JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_ABI, signer);
    return contract.redeem(amount, await signer.getAddress());
}

export const juniorQueueWithdrawal = async (signer: JsonRpcSigner, amount: BigNumber, maxWithdrawDelay: BigNumber) => {
    const contract = new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signer);
    return contract.queueWithdrawal(amount, maxWithdrawDelay);
}

export const juniorCompleteWithdraw = async (signer: JsonRpcSigner) => {
    const contract = new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signer);
    return contract.completeWithdraw();
}

export const cancelWithdrawal = async (signer: JsonRpcSigner) => {
    const contract = new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signer);
    return contract.cancelWithdrawal();
}

export const formatJDolaStakingData = (
    dbrDolaPriceUsd: number,
    jdolaStakingData: any[],
    fallbackData?: any,
    supplyDelta = 0,
) => {
    const jDolaSupply = (jdolaStakingData ? getBnToNumber(jdolaStakingData[0]) : fallbackData?.jDolaSupply || 0);
    const yearlyRewardBudget = jdolaStakingData ? getBnToNumber(jdolaStakingData[1]) : fallbackData?.yearlyRewardBudget || 0;
    const maxYearlyRewardBudget = jdolaStakingData ? getBnToNumber(jdolaStakingData[2]) : fallbackData?.maxYearlyRewardBudget || 0;
    const maxDbrDolaRatioBps = jdolaStakingData ? getBnToNumber(jdolaStakingData[3]) : fallbackData?.maxDbrDolaRatioBps || 0;
    const maxRewardPerDolaMantissa = maxDbrDolaRatioBps * 1e14;
    
    const weeklyRevenue = jdolaStakingData ? getBnToNumber(jdolaStakingData[4]) : fallbackData?.weeklyRevenue || 0;
    const pastWeekRevenue = jdolaStakingData ? getBnToNumber(jdolaStakingData[5]) : fallbackData?.pastWeekRevenue || 0;
    const jDolaTotalAssetsCurrent = (jdolaStakingData ? getBnToNumber(jdolaStakingData[6]) : fallbackData?.jDolaTotalAssets || 0);
    const jDolaTotalAssets = jDolaTotalAssetsCurrent + supplyDelta;        

    const dbrRatePerDola = jDolaTotalAssets > 0 ? Math.min(yearlyRewardBudget / jDolaTotalAssets, maxRewardPerDolaMantissa) : maxRewardPerDolaMantissa;
    const now = Date.now();
    const secondsPastEpoch = (now - getLastThursdayTimestamp()) / 1000;
    const realizedTimeInDays = secondsPastEpoch / ONE_DAY_SECS;
    const nextTotalAssets = jDolaTotalAssets + weeklyRevenue;
    const realized = ((weeklyRevenue / realizedTimeInDays) * 365) / jDolaTotalAssets;
    const forecasted = (nextTotalAssets * dbrDolaPriceUsd * dbrRatePerDola) / jDolaTotalAssets;
    // we use two week revenu epoch for the projected apr
    const calcPeriodSeconds = 14 * ONE_DAY_SECS;
    const projectedApr = dbrDolaPriceUsd ?
        ((secondsPastEpoch / calcPeriodSeconds) * realized + ((calcPeriodSeconds - secondsPastEpoch) / calcPeriodSeconds) * forecasted) * 100 : 0;
    const apr = jDolaTotalAssets > 0 ? (pastWeekRevenue * WEEKS_PER_YEAR) / jDolaTotalAssets * 100 : 0;
    const nextApr = jDolaTotalAssets > 0 ? (weeklyRevenue * WEEKS_PER_YEAR) / jDolaTotalAssets * 100 : 0;
    const jDolaExRate = jDolaTotalAssetsCurrent && jDolaSupply ? jDolaTotalAssetsCurrent / jDolaSupply : 0;

    return {
        exitWindow: jdolaStakingData ? getBnToNumber(jdolaStakingData[7], 0) : 86400*2,
        withdrawFee: jdolaStakingData ? getBnToNumber(jdolaStakingData[8], 0)/10000 : 0,
        jDolaExRate,
        jDolaSupply,
        jDolaTotalAssets,
        dbrRatePerDola,
        yearlyDbrEarnings: dbrRatePerDola * jDolaTotalAssetsCurrent,
        yearlyRewardBudget,
        maxYearlyRewardBudget,
        maxRewardPerDolaMantissa,
        weeklyRevenue,
        pastWeekRevenue,
        apr,
        // weekly compounding
        apy: aprToApy(apr, WEEKS_PER_YEAR),
        nextApr,
        nextApy: aprToApy(nextApr, WEEKS_PER_YEAR),
        projectedApr,
        projectedApy: aprToApy(projectedApr, WEEKS_PER_YEAR),
    }
}

export const useStakedJDola = (dbrDolaPriceUsd: number, supplyDelta = 0): {
    jDolaSupply: number;
    jDolaTotalAssets: number;
    yearlyRewardBudget: number;
    yearlyBudget: number;
    maxYearlyRewardBudget: number;
    maxRewardPerDolaMantissa: number;
    weeklyRevenue: number;
    pastWeekRevenue: number;
    dbrRatePerDola: number;
    apr: number;
    apy30d: number;
    apy: number;
    projectedApr: number;
    projectedApy: number;
    nextApr: number;
    nextApy: number;
    isLoading: boolean;
    hasError: boolean;
    jDolaExRate: number;
    yearlyDbrEarnings: number;
    exitWindow: number;
    withdrawFee: number;
} => {
    const { data: apiData, error: apiErr } = useCacheFirstSWR(`/api/junior/jdola-staking`);   
    const weekIndexUtc = getWeekIndexUtc();

    const { data: jdolaStakingData, error } = useEtherSWR([
        [JDOLA_AUCTION_ADDRESS, 'totalSupply'],
        [JDOLA_AUCTION_ADDRESS, 'yearlyRewardBudget'],
        [JDOLA_AUCTION_ADDRESS, 'maxYearlyRewardBudget'],
        [JDOLA_AUCTION_ADDRESS, 'maxDbrDolaRatioBps'],  
        [JDOLA_AUCTION_ADDRESS, 'weeklyRevenue', weekIndexUtc],
        [JDOLA_AUCTION_ADDRESS, 'weeklyRevenue', weekIndexUtc - 1],
        [JDOLA_AUCTION_ADDRESS, 'totalAssets'],     
        [JUNIOR_ESCROW_ADDRESS, 'exitWindow'],
        [JUNIOR_ESCROW_ADDRESS, 'withdrawFeeBps'],
    ]);

    return {
        ...formatJDolaStakingData(dbrDolaPriceUsd, jdolaStakingData, apiData, supplyDelta),
        apy30d: apiData?.apy30d || 0,
        isLoading: (!jdolaStakingData && !error) && (!apiData && !apiErr),
        hasError: !!error || !!apiErr,
    }
}

export const useStakedJDolaBalance = (account: string, ad = JDOLA_AUCTION_ADDRESS) => {
    const { data, error } = useEtherSWR([ad, 'balanceOf', account]);
    return {
        bnBalance: data || BigNumber.from('0'),
        balance: data ? getBnToNumber(data) : 0,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}

export const useJDolaStakingEarnings = (account: string) => {
    const { events: depositEventsData } = useContractEvents(
        JDOLA_AUCTION_ADDRESS,
        SDOLA_ABI,
        'Deposit',
        [account],
    );
    const { events: withdrawEventsData } = useContractEvents(
        JDOLA_AUCTION_ADDRESS,
        SDOLA_ABI,
        'Withdraw',
        [account],
    );
    const { balance: stakedDolaBalance, bnBalance } = useStakedJDolaBalance(account);
    const deposited = depositEventsData.reduce((prev, curr) => {
        return prev + getBnToNumber(curr.args[2]);
    }, 0);
    const withdrawn = withdrawEventsData.reduce((prev, curr) => {
        return prev + getBnToNumber(curr.args[3]);
    }, 0);

    return {
        earnings: stakedDolaBalance - deposited + withdrawn,
        deposited,
        withdrawn,
        stakedDolaBalance,
        stakedDolaBalanceBn: bnBalance,
    };
}

export const useJuniorWithdrawDelay = (
    currentSupply,
    withdrawAmount,
    userAddress,
) => {  
    const { provider } = useWeb3React<Web3Provider>()

    const { data: escrowData } = useEtherSWR([
        [JUNIOR_ESCROW_ADDRESS, 'exitWindows', userAddress],
        [JUNIOR_ESCROW_ADDRESS, 'withdrawAmounts', userAddress],
    ]);
    
    const { data, error } = useSWR(['getWithdrawDelay', parseEther(currentSupply?.toString()||'0').toString(), parseEther(withdrawAmount?.toString()||'0').toString(), userAddress], (...args) => {
      const [method, ...otherParams] = args
      if (provider) {
        return getJuniorWithdrawModelContract(provider?.getSigner()).callStatic[method](...otherParams)
      }
      return null
    })

    const now = Date.now();

    const exitWindowStart = escrowData && !!escrowData[0] ? getBnToNumber(escrowData[0][0], 0) * 1000 : 0;
    const exitWindowEnd = escrowData && !!escrowData[0] ? getBnToNumber(escrowData[0][1], 0) * 1000 : 0;
    const pendingAmount = escrowData && !!escrowData[1] ? getBnToNumber(escrowData[1]) : 0;

    return {
      pendingAmount,
      // in seconds
      withdrawDelay: data ? getBnToNumber(data, 0) : BigNumber.from(0),
      withdrawTimestamp: data ? now + getBnToNumber(data, 0) * 1000 : null,
      exitWindowStart,
      exitWindowEnd,
      canCancel: !!exitWindowStart && now >= exitWindowStart,
      isWithinExitWindow: exitWindowStart ? now <= exitWindowEnd && now >= exitWindowStart : false,
      hasComingExit: exitWindowStart ? !!exitWindowStart && now < exitWindowStart : false,
      isLoading: !error && !data,
      isError: error,
    }
  }