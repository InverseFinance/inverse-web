import { BigNumber, Contract } from "ethers";
import { DBR_AUCTION_HELPER_ABI, JDOLA_AUCTION_ABI, JUNIOR_ESCROW_ABI, SDOLA_ABI } from "@app/config/abis";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { parseEther } from "@ethersproject/units";
import { JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_HELPER_ADDRESS, JUNIOR_ESCROW_ADDRESS, JUNIOR_WITHDRAW_MODEL, ONE_DAY_SECS, WEEKS_PER_YEAR } from "@app/config/constants";
import { aprToApy, getBnToNumber } from "./markets";
import { getLastThursdayTimestamp, getWeekIndexUtc } from "./misc";
import { useAccount } from "@app/hooks/misc";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { useCacheFirstSWR } from "@app/hooks/useCustomSWR";
import { useContractEvents } from "@app/hooks/useContractEvents";
import useSWR from "swr";
import { useWeb3React } from "@web3-react/core";

export const getJrdolaContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(JDOLA_AUCTION_ADDRESS, JDOLA_AUCTION_ABI, signerOrProvider);
}

export const getJuniorEscrowContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(JUNIOR_ESCROW_ADDRESS, JUNIOR_ESCROW_ABI, signerOrProvider);
}

export const getJuniorWithdrawModelContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(JUNIOR_WITHDRAW_MODEL, ["function getWithdrawDelay(uint totalSupply, uint totalWithdrawing, address withdrawer) external returns(uint)"], signerOrProvider);
}

export const stakeJDola = async (signer: JsonRpcSigner, amount: BigNumber, isDolaCase = false, minJrDolaShares: BigNumber) => {
    if(isDolaCase) {
        const contract = new Contract(JDOLA_AUCTION_HELPER_ADDRESS, DBR_AUCTION_HELPER_ABI, signer);
        return contract.depositDola(amount, minJrDolaShares);
    }
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
    jrDolaStakingData: any[],
    fallbackData?: any,
    supplyDelta = 0,
) => {
    const jrDolaSupply = (jrDolaStakingData ? getBnToNumber(jrDolaStakingData[0]) : fallbackData?.jrDolaSupply || 0);
    const yearlyRewardBudget = jrDolaStakingData ? getBnToNumber(jrDolaStakingData[1]) : fallbackData?.yearlyRewardBudget || 0;
    const maxYearlyRewardBudget = jrDolaStakingData ? getBnToNumber(jrDolaStakingData[2]) : fallbackData?.maxYearlyRewardBudget || 0;
    const maxDolaDbrRatioBps = jrDolaStakingData ? getBnToNumber(jrDolaStakingData[3]) : fallbackData?.maxDolaDbrRatioBps || 0;
    const maxRewardPerDolaMantissa = maxDolaDbrRatioBps * 1e14;
    
    const weeklyRevenue = jrDolaStakingData ? getBnToNumber(jrDolaStakingData[4]) : fallbackData?.weeklyRevenue || 0;
    const pastWeekRevenue = jrDolaStakingData ? getBnToNumber(jrDolaStakingData[5]) : fallbackData?.pastWeekRevenue || 0;
    const jrDolaTotalAssetsCurrent = (jrDolaStakingData ? getBnToNumber(jrDolaStakingData[6]) : fallbackData?.jrDolaTotalAssets || 0);
    const jrDolaTotalAssets = jrDolaTotalAssetsCurrent + supplyDelta;        

    const dbrRatePerDola = jrDolaTotalAssets > 0 ? Math.min(yearlyRewardBudget / jrDolaTotalAssets, maxRewardPerDolaMantissa) : maxRewardPerDolaMantissa;
    const now = Date.now();
    const secondsPastEpoch = (now - getLastThursdayTimestamp()) / 1000;
    const realizedTimeInDays = secondsPastEpoch / ONE_DAY_SECS;
    const nextTotalAssets = jrDolaTotalAssets + weeklyRevenue;
    const realized = ((weeklyRevenue / realizedTimeInDays) * 365) / jrDolaTotalAssets;
    const forecasted = (nextTotalAssets * dbrDolaPriceUsd * dbrRatePerDola) / jrDolaTotalAssets;
    // we use two week revenu epoch for the projected apr
    const calcPeriodSeconds = 14 * ONE_DAY_SECS;
    const projectedApr = dbrDolaPriceUsd ?
        ((secondsPastEpoch / calcPeriodSeconds) * realized + ((calcPeriodSeconds - secondsPastEpoch) / calcPeriodSeconds) * forecasted) * 100 : 0;
    const apr = jrDolaTotalAssets > 0 ? (pastWeekRevenue * WEEKS_PER_YEAR) / jrDolaTotalAssets * 100 : 0;
    const nextApr = jrDolaTotalAssets > 0 ? (weeklyRevenue * WEEKS_PER_YEAR) / jrDolaTotalAssets * 100 : 0;
    const jrDolaExRate = jrDolaTotalAssetsCurrent && jrDolaSupply ? jrDolaTotalAssetsCurrent / jrDolaSupply : 0;

    return {
        exitWindow: jrDolaStakingData ? getBnToNumber(jrDolaStakingData[7], 0) : 86400*2,
        withdrawFeePerc: jrDolaStakingData ? getBnToNumber(jrDolaStakingData[8], 0)/100 : 0,
        jrDolaExRate,
        jrDolaSupply,
        jrDolaTotalAssets,
        dbrRatePerDola,
        yearlyDbrEarnings: dbrRatePerDola * jrDolaTotalAssetsCurrent,
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
        projectedApy: aprToApy(projectedApr, WEEKS_PER_YEAR) || 0,
    }
}

export const useStakedJDola = (dbrDolaPriceUsd: number, supplyDelta = 0): {
    jrDolaSupply: number;
    jrDolaTotalAssets: number;
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
    jrDolaExRate: number;
    yearlyDbrEarnings: number;
    exitWindow: number;
    withdrawFeePerc: number;
} => {
    const { data: apiData, error: apiErr } = useCacheFirstSWR(`/api/junior/jdola-staking`);   
    const weekIndexUtc = getWeekIndexUtc();

    const { data: jrDolaStakingData, error } = useEtherSWR([
        [JDOLA_AUCTION_ADDRESS, 'totalSupply'],
        [JDOLA_AUCTION_ADDRESS, 'yearlyRewardBudget'],
        [JDOLA_AUCTION_ADDRESS, 'maxYearlyRewardBudget'],
        [JDOLA_AUCTION_ADDRESS, 'maxDolaDbrRatioBps'],  
        [JDOLA_AUCTION_ADDRESS, 'weeklyRevenue', weekIndexUtc],
        [JDOLA_AUCTION_ADDRESS, 'weeklyRevenue', weekIndexUtc - 1],
        [JDOLA_AUCTION_ADDRESS, 'totalAssets'],     
        [JUNIOR_ESCROW_ADDRESS, 'exitWindow'],
        [JUNIOR_ESCROW_ADDRESS, 'withdrawFeeBps'],
    ]);

    return {
        ...formatJDolaStakingData(dbrDolaPriceUsd, jrDolaStakingData, apiData, supplyDelta),
        apy30d: apiData?.apy30d || 0,
        isLoading: (!jrDolaStakingData && !error) && (!apiData && !apiErr),
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
    maxBalanceBn,
) => {  
    const { data: blockData } = useEtherSWR(
        ['getBlock', 'latest']
    );
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

    // unstake all case
    const { data: dataUnstakeAll } = useSWR(['getWithdrawDelayMax', parseEther(currentSupply?.toString()||'0').toString(), maxBalanceBn, userAddress], (...args) => {
        const [name, ...otherParams] = args
        if (provider) {
          return getJuniorWithdrawModelContract(provider?.getSigner()).callStatic['getWithdrawDelay'](...otherParams)
        }
        return null
      })

    const now = (blockData?.timestamp * 1000) || Date.now();

    const exitWindowStart = escrowData && !!escrowData[0] ? getBnToNumber(escrowData[0][0], 0) * 1000 : 0;
    const exitWindowEnd = escrowData && !!escrowData[0] ? getBnToNumber(escrowData[0][1], 0) * 1000 : 0;
    const pendingAmount = escrowData && !!escrowData[1] ? getBnToNumber(escrowData[1]) : 0;

    return {
      pendingAmount,
      // in seconds
      withdrawDelay: data ? getBnToNumber(data, 0) : BigNumber.from(0),
      withdrawTimestamp: data ? now + getBnToNumber(data, 0) * 1000 : null,
      withdrawDelayMax: dataUnstakeAll ? getBnToNumber(dataUnstakeAll, 0) : BigNumber.from(0),
      withdrawTimestampMax: dataUnstakeAll ? now + getBnToNumber(dataUnstakeAll, 0) * 1000 : null,
      exitWindowStart,
      exitWindowEnd,
      canCancel: !!exitWindowStart && now >= exitWindowStart,
      isWithinExitWindow: exitWindowStart ? now <= exitWindowEnd && now >= exitWindowStart : false,
      hasComingExit: exitWindowEnd ? !!exitWindowEnd && now < exitWindowEnd : false,
      isLoading: !error && !data,
      isError: error,
    }
  }