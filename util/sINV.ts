import { DBR_DISTRIBUTOR_ABI, F2_ESCROW_ABI, SINV_ABI, SINV_HELPER_ABI } from "@app/config/abis";
import { BURN_ADDRESS, ONE_DAY_MS, ONE_DAY_SECS, SINV_ADDRESS, SDOLA_HELPER_ADDRESS, WEEKS_PER_YEAR, SINV_ESCROW_ADDRESS, DBR_DISTRIBUTOR_ADDRESS } from "@app/config/constants";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { aprToApy, getBnToNumber } from "./markets";
import { useCacheFirstSWR, useCustomSWR } from "@app/hooks/useCustomSWR";
import { useContractEvents } from "@app/hooks/useContractEvents";
import { ascendingEventsSorter } from "./misc";
import { useBlocksTimestamps } from "@app/hooks/useBlockTimestamp";
import { SWR } from "@app/types";
import { fetcher } from "./web3";
import { useMemo } from "react";
import { useDBRMarkets } from "@app/hooks/useDBR";

export const getDbrDistributorContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(DBR_DISTRIBUTOR_ADDRESS, DBR_DISTRIBUTOR_ABI, signerOrProvider);
}

export const getSinvEscrowContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(SINV_ESCROW_ADDRESS, F2_ESCROW_ABI, signerOrProvider);
}

export const getSInvContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(SINV_ADDRESS, SINV_ABI, signerOrProvider);
}

export const getSInvHelperContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(SDOLA_HELPER_ADDRESS, SINV_HELPER_ABI, signerOrProvider);
}

export const sellInvForDbr = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber) => {
    const contract = getSInvContract(signerOrProvider);
    return contract.buyDBR(dolaToSell, minDbrOut);
}

export const swapExactInvForDbr = (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber) => {
    const contract = getSInvHelperContract(signerOrProvider);
    return contract.swapExactInvForDbr(dolaToSell, minDbrOut);
}

export const swapInvForExactDbr = (signerOrProvider: JsonRpcSigner, dolaInMax: BigNumber, dbrOut: BigNumber) => {
    const contract = getSInvHelperContract(signerOrProvider);
    return contract.swapInvForExactDbr(dbrOut, dolaInMax);
}

export const getDbrOut = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber) => {
    const contract = getSInvHelperContract(signerOrProvider);
    return contract.getDbrOut(dolaToSell);
}

export const stakeInv = async (signerOrProvider: JsonRpcSigner, dolaIn: BigNumber, recipient?: string) => {
    const contract = getSInvContract(signerOrProvider);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    return contract.deposit(dolaIn, _recipient);
}

export const unstakeInv = async (signerOrProvider: JsonRpcSigner, dolaOut: BigNumber, recipient?: string) => {
    const contract = getSInvContract(signerOrProvider);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    const owner = (await signerOrProvider.getAddress())
    return contract.withdraw(dolaOut, _recipient, owner);
}

export const redeemSInv = async (signerOrProvider: JsonRpcSigner, sInvAmount: BigNumber, recipient?: string) => {
    const contract = getSInvContract(signerOrProvider);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    const owner = (await signerOrProvider.getAddress())
    return contract.redeem(sInvAmount, _recipient, owner);
}

export const useStakedInvBalance = (account: string, ad = SINV_ADDRESS) => {
    const { data, error } = useEtherSWR([ad, 'balanceOf', account]);
    return {
        bnBalance: data || BigNumber.from('0'),
        balance: data ? getBnToNumber(data) : 0,
        isLoading: !data && !error,
        hasError: !data && !!error,
    };
}

export const useStakedInv = (dbrDolaPrice: number, supplyDelta = 0): {
    sInvSupply: number;
    sInvTotalAssets: number;
    distributorTotalSupply: number;
    yearlyRewardBudget: number;
    distributorYearlyBudget: number;
    maxYearlyRewardBudget: number;
    invBalInFirmFromSInv: number;
    maxRewardPerDolaMantissa: number;
    periodRevenue: number;
    pastPeriodRevenue: number;
    sInvClaimable: number;
    accountRewardsClaimable: number;
    dbrRatePerInv: number;
    apr: number;
    auctionApr: number;
    apy: number;
    projectedApr: number;
    projectedApy: number;
    nextApr: number;
    nextApy: number;
    isLoading: boolean;
    hasError: boolean;
    sInvExRate: number;
} => {
    const { data: apiData, error: apiErr } = useCacheFirstSWR(`/api/inv-staking`);
    const { markets } = useDBRMarkets();
    const firmInvMarket = markets?.find(m => m.name === 'INV');
    const firmInvApr = firmInvMarket?.supplyApy || 0;

    const { data: metaData, error } = useEtherSWR([
        [SINV_ESCROW_ADDRESS, 'claimable'],
        [SINV_ESCROW_ADDRESS, 'balance'],
        [DBR_DISTRIBUTOR_ADDRESS, 'totalSupply'],
        [DBR_DISTRIBUTOR_ADDRESS, 'rewardRate'],
        [DBR_DISTRIBUTOR_ADDRESS, 'maxRewardRate'],       
    ]);
    const { data: sInvData } = useEtherSWR([
        [SINV_ADDRESS, 'totalSupply'],
        [SINV_ADDRESS, 'periodRevenue'],
        [SINV_ADDRESS, 'lastPeriodRevenue'],
        [SINV_ADDRESS, 'totalAssets'],
    ]);
    
    const invStakingData = metaData && sInvData ? metaData.concat(sInvData) : undefined;

    return {
        ...formatInvStakingData(dbrDolaPrice, invStakingData, firmInvApr, apiData, supplyDelta),
        isLoading: (!invStakingData && !error) && (!apiData && !apiErr),
        hasError: !!error || !!apiErr,
    }
}

export const formatInvStakingData = (
    dbrDolaPrice: number,
    invStakingData: any[],
    firmInvApr: number,    
    fallbackData?: any,
    supplyDelta = 0,
) => {
    const sInvClaimable = invStakingData ? getBnToNumber(invStakingData[0]) : fallbackData?.sInvClaimable || 0;
    const invBalInFirmFromSInv = invStakingData ? getBnToNumber(invStakingData[1]) : fallbackData?.invBalInFirmFromSInv || 0;
    const distributorTotalSupply = (invStakingData ? getBnToNumber(invStakingData[2]) : fallbackData?.distributorTotalSupply || 0) + supplyDelta;

    const distributorYearlyBudget = invStakingData ? getBnToNumber(invStakingData[3]) : fallbackData?.distributorYearlyBudget || 0;
    const maxYearlyRewardBudget = invStakingData ? getBnToNumber(invStakingData[4]) : fallbackData?.maxYearlyRewardBudget || 0;
    const sInvSupply = (invStakingData ? getBnToNumber(invStakingData[5]) : fallbackData?.sInvSupply || 0);
    const periodRevenue = invStakingData ? getBnToNumber(invStakingData[6]) : fallbackData?.periodRevenue || 0;
    const pastPeriodRevenue = invStakingData ? getBnToNumber(invStakingData[7]) : fallbackData?.pastPeriodRevenue || 0;
    const sInvTotalAssetsCurrent = (invStakingData ? getBnToNumber(invStakingData[8]) : fallbackData?.sInvTotalAssets || 0);
    const sInvTotalAssets = sInvTotalAssetsCurrent + supplyDelta;        

    const sInvDistributorShare = distributorTotalSupply > 0 ? invBalInFirmFromSInv / distributorTotalSupply : 1;
    // sDOLA budget share
    const yearlyRewardBudget = sInvDistributorShare > 0 ? distributorYearlyBudget * sInvDistributorShare : distributorYearlyBudget;

    const distributorDbrRatePerInv = distributorTotalSupply > 0 ? distributorYearlyBudget / distributorTotalSupply : 0;
    const dbrRatePerInv = invBalInFirmFromSInv > 0 ? yearlyRewardBudget / invBalInFirmFromSInv : 0;
    const now = Date.now();
    const secondsPastEpoch = (now - getLastThursdayTimestamp()) / 1000;
    const realizedTimeInDays = secondsPastEpoch / ONE_DAY_SECS;
    const nextTotalAssets = sInvTotalAssets + periodRevenue;
    const realized = ((periodRevenue / realizedTimeInDays) * 365) / sInvTotalAssets;
    const forecasted = (nextTotalAssets * dbrDolaPrice * dbrRatePerInv) / sInvTotalAssets;
    // we use two week revenu epoch for the projected auctionApr
    const calcPeriodSeconds = 14 * ONE_DAY_SECS;
    const projectedApr = dbrDolaPrice ?
        ((secondsPastEpoch / calcPeriodSeconds) * realized + ((calcPeriodSeconds - secondsPastEpoch) / calcPeriodSeconds) * forecasted) * 100 : 0;
    const auctionApr = sInvTotalAssets > 0 ? (pastPeriodRevenue * WEEKS_PER_YEAR) / sInvTotalAssets * 100 : 0;
    const nextApr = sInvTotalAssets > 0 ? (periodRevenue * WEEKS_PER_YEAR) / sInvTotalAssets * 100 : 0;
    const sInvExRate = sInvTotalAssetsCurrent && sInvSupply ? sInvTotalAssetsCurrent / sInvSupply : 0;

    // auctionApr is related to the DBR apr
    const totalApr = auctionApr + firmInvApr;

    return {
        sInvExRate,
        sInvSupply,
        sInvTotalAssets,
        distributorTotalSupply,
        sInvDistributorShare,
        dbrRatePerInv,
        distributorDbrRatePerInv,
        yearlyDbrEarnings: dbrRatePerInv * invBalInFirmFromSInv,
        invBalInFirmFromSInv,
        yearlyRewardBudget,
        distributorYearlyBudget,
        maxYearlyRewardBudget,
        periodRevenue,
        pastPeriodRevenue,
        sInvClaimable,        
        auctionApr,
        auctionApy: aprToApy(auctionApr, WEEKS_PER_YEAR),
        apr: totalApr,
        // weekly compounding
        apy: aprToApy(auctionApr, WEEKS_PER_YEAR) + firmInvApr,
        nextApr,
        nextApy: aprToApy(nextApr, WEEKS_PER_YEAR),
        projectedApr: projectedApr + firmInvApr,
        projectedApy: aprToApy(projectedApr, WEEKS_PER_YEAR) + firmInvApr,
    }
}

export const useInvStakingActivity = (from?: string, type = 'sinv'): SWR & {
    events: any,
    accountEvents: any,
    timestamp: number,
} => {
    const liveEvents = useInvStakingEvents();
    const { data, error } = useCustomSWR(`/api/inv-staking/activity`, fetcher);

    const events = (liveEvents?.length > data?.events?.length ? liveEvents : data?.events || [])
        .filter(e => e.type === type)
        .map((e, i) => ({...e, key: `${e.txHash}-${i}` }));
    return {
        events,
        accountEvents: events.filter(e => !from || e.recipient === from),
        timestamp: data ? data.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

export const useInvStakingEvolution = (): SWR & {
    evolution: any[],
    timestamp: number,
} => {
    const { data, error } = useCacheFirstSWR(`/api/inv-staking/history?v=1.0.2`, fetcher);

    const evolution = useMemo(() => {
        return (data?.totalEntries || []).map((e) => ({ ...e, apy: aprToApy(e.apr, WEEKS_PER_YEAR) }));
    }, [data?.timestamp, data?.totalEntries]);

    return {
        evolution,
        timestamp: data ? data.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

export const useInvStakingEarnings = (account: string) => {
    const { events: depositEventsData } = useContractEvents(
        SINV_ADDRESS,
        SINV_ABI,
        'Deposit',
        [account],
    );
    const { events: withdrawEventsData } = useContractEvents(
        SINV_ADDRESS,
        SINV_ABI,
        'Withdraw',
        [account],
    );
    const { balance: stakedInvBalance, bnBalance } = useStakedInvBalance(account);
    const deposited = depositEventsData.reduce((prev, curr) => {
        return prev + getBnToNumber(curr.args[2]);
    }, 0);
    const withdrawn = withdrawEventsData.reduce((prev, curr) => {
        return prev + getBnToNumber(curr.args[3]);
    }, 0);

    return {
        earnings: stakedInvBalance - deposited + withdrawn,
        deposited,
        withdrawn,
        stakedInvBalance,
        stakedInvBalanceBn: bnBalance,
    };
}

export const useInvStakingEvents = () => {   
    const { events: depositEventsData } = useContractEvents(
        SINV_ADDRESS,
        SINV_ABI,
        'Deposit',
    );
    const { events: withdrawEventsData } = useContractEvents(
        SINV_ADDRESS,
        SINV_ABI,
        'Withdraw',
    );
    const eventsData = depositEventsData
        .concat(withdrawEventsData);
    const sortedEvents = eventsData.sort(ascendingEventsSorter);
    const uniqueBlocks = [...new Set(sortedEvents.map(e => e.blockNumber))];
    const { timestamps } = useBlocksTimestamps(uniqueBlocks);
    const timestampsAsObj = timestamps.reduce((prev, curr, i) => ({ ...prev, [uniqueBlocks[i]]: curr / 1000 }), {});
    return formatInvStakingEvents(sortedEvents, timestampsAsObj);
}

export const formatInvStakingEvents = (events: any[], timestamps?: any, alreadyStaked = 0, sInvAlreadyStaked = 0) => {
    let totalInvStaked = alreadyStaked;
    let sInvStaking = sInvAlreadyStaked;
    return events.map(e => {
        const action = ['Deposit', 'Stake'].includes(e.event) ? 'Stake' : ['Withdraw', 'Unstake'].includes(e.event) ? 'Unstake' : 'Claim';
        const type = ['Deposit', 'Withdraw'].includes(e.event) ? 'sinv' : 'dsa';
        const amount = getBnToNumber(e.args.amount || e.args.assets || '0');
        if (action !== 'Claim' && type === 'dsa') {
            totalInvStaked += (action === 'Stake' ? amount : -amount);
        } else if (type === 'sinv') {
            sInvStaking += (action === 'Stake' ? amount : -amount);
        }
        const recipient = e.args.recipient || e.args.owner || e.args.caller;
        return {
            txHash: e.transactionHash,
            timestamp: timestamps ? timestamps[e.blockNumber] * 1000 : undefined,
            blockNumber: e.blockNumber,
            caller: e.args.caller,
            recipient,
            amount,
            // Stake, Unstake, Claim are from DSA directly
            type,
            event: e.event,
            name: action,
            totalInvStaked,
            sInvStaking,
        };
    });
}

export function getLastThursdayTimestamp() {
    const now = new Date();
    const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0);
    const today = new Date(nowUTC);
    const dayOfWeek = today.getUTCDay();
    const daysSinceLastThursday = dayOfWeek >= 4 ? dayOfWeek - 4 : 7 - (4-dayOfWeek);
    today.setUTCDate(today.getUTCDate() - daysSinceLastThursday);
    return +(today);
}

export function getNextThursdayTimestamp() {
    return getLastThursdayTimestamp() + 7 * ONE_DAY_MS;
}