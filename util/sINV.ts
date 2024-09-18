import { DBR_DISTRIBUTOR_ABI, F2_ESCROW_ABI, SINV_ABI, SINV_HELPER_ABI } from "@app/config/abis";
import { BURN_ADDRESS, ONE_DAY_MS, ONE_DAY_SECS, SINV_ADDRESS, SINV_HELPER_ADDRESS, WEEKS_PER_YEAR, SINV_ESCROW_ADDRESS, DBR_DISTRIBUTOR_ADDRESS, SINV_ADDRESS_V1, SINV_ESCROW_ADDRESS_V1, SINV_HELPER_ADDRESS_V1 } from "@app/config/constants";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { aprToApy, getBnToNumber } from "./markets";
import { useCacheFirstSWR, useCustomSWR } from "@app/hooks/useCustomSWR";
import { useContractEvents } from "@app/hooks/useContractEvents";
import { ascendingEventsSorter, getLastThursdayTimestamp, getWeekIndexUtc } from "./misc";
import { useBlocksTimestamps } from "@app/hooks/useBlockTimestamp";
import { SWR } from "@app/types";
import { fetcher } from "./web3";
import { useMemo } from "react";
import { useDBRMarkets } from "@app/hooks/useDBR";

export const VERSIONED_ADDRESSES = {
    'V2': {
        sinv: SINV_ADDRESS,
        escrow: SINV_ESCROW_ADDRESS,
        helper: SINV_HELPER_ADDRESS,
    },
    'V1': {
        sinv: SINV_ADDRESS_V1,
        escrow: SINV_ESCROW_ADDRESS_V1,
        helper: SINV_HELPER_ADDRESS_V1,
    },
}

export const getDbrDistributorContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(DBR_DISTRIBUTOR_ADDRESS, DBR_DISTRIBUTOR_ABI, signerOrProvider);
}

export const getSinvEscrowContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(SINV_ESCROW_ADDRESS, F2_ESCROW_ABI, signerOrProvider);
}

export const getSInvContract = (signerOrProvider: JsonRpcSigner, sinvAddress = SINV_ADDRESS) => {
    return new Contract(sinvAddress, SINV_ABI, signerOrProvider);
}

export const getSInvHelperContract = (signerOrProvider: JsonRpcSigner) => {
    return new Contract(SINV_HELPER_ADDRESS, SINV_HELPER_ABI, signerOrProvider);
}

export const swapExactInvForDbr = (signerOrProvider: JsonRpcSigner, invToGive: BigNumber, minDbrOut: BigNumber) => {
    const contract = getSInvHelperContract(signerOrProvider);
    return contract.swapExactInvForDbr(invToGive, minDbrOut);
}

export const swapInvForExactDbr = (signerOrProvider: JsonRpcSigner, dolaInMax: BigNumber, dbrOut: BigNumber) => {
    const contract = getSInvHelperContract(signerOrProvider);
    return contract.swapInvForExactDbr(dbrOut, dolaInMax);
}

export const getDbrOut = async (signerOrProvider: JsonRpcSigner, invToGive: BigNumber) => {
    const contract = getSInvHelperContract(signerOrProvider);
    return contract.getDbrOut(invToGive);
}

export const stakeInv = async (signerOrProvider: JsonRpcSigner, dolaIn: BigNumber, version = 'V2', recipient?: string) => {
    const contract = getSInvContract(signerOrProvider, VERSIONED_ADDRESSES[version].sinv);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    return contract.deposit(dolaIn, _recipient);
}

export const unstakeInv = async (signerOrProvider: JsonRpcSigner, dolaOut: BigNumber, version = 'V2', recipient?: string) => {
    const contract = getSInvContract(signerOrProvider, VERSIONED_ADDRESSES[version].sinv);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    const owner = (await signerOrProvider.getAddress())
    return contract.withdraw(dolaOut, _recipient, owner);
}

export const redeemSInv = async (signerOrProvider: JsonRpcSigner, sInvAmount: BigNumber, version = 'V2', recipient?: string) => {
    const contract = getSInvContract(signerOrProvider, VERSIONED_ADDRESSES[version].sinv);
    const _recipient = !!recipient && recipient !== BURN_ADDRESS ? recipient : (await signerOrProvider.getAddress());
    const owner = (await signerOrProvider.getAddress())
    return contract.redeem(sInvAmount, _recipient, owner);
}

export const useStakedInvBalance = (account: string, version = 'V2') => {
    const sinvAddress = VERSIONED_ADDRESSES[version].sinv;
    const { data, error } = useEtherSWR([sinvAddress, 'balanceOf', account]);
    const { data: assetsData, error: assetsError } = useEtherSWR([sinvAddress, 'convertToAssets', data]);
    return {
        bnShares: data || BigNumber.from('0'),
        bnAssets: assetsData || BigNumber.from('0'),
        shares: data ? getBnToNumber(data) : 0,
        assets: assetsData && data ? getBnToNumber(assetsData) : 0,
        isLoading: (!data && !error) || (!assetsData && !assetsError),
        hasError: (!data && !!error) || (!assetsData && !!assetsError),
    };
}

export const useStakedInv = (dbrDolaPrice: number, version = 'V2', supplyDelta = 0): {
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
    depositLimit: number;
} => {
    const { data: apiData, error: apiErr } = useCacheFirstSWR(`/api/inv-staking?v=1.0.3`);
    const { markets } = useDBRMarkets();
    const firmInvMarket = markets?.find(m => m.name === 'INV');
    const firmInvApr = firmInvMarket?.supplyApy || 0;
    const dbrInvExRate = firmInvMarket?.dbrInvExRate || 0;
    const invStakedViaDistributor = firmInvMarket?.invStakedViaDistributor || 0;

    const sinvEscrowAddress = VERSIONED_ADDRESSES[version].escrow;    
    const sinvAddress = VERSIONED_ADDRESSES[version].sinv;

    const { data: metaData, error } = useEtherSWR([
        [sinvEscrowAddress, 'claimable'],
        [sinvEscrowAddress, 'balance'],
        [DBR_DISTRIBUTOR_ADDRESS, 'totalSupply'],
        [DBR_DISTRIBUTOR_ADDRESS, 'rewardRate'],
        [DBR_DISTRIBUTOR_ADDRESS, 'maxRewardRate'],       
    ]);
    // periodRevenue is not necessarily the current period, verify with lastBuyPeriod and current week index, same with lastPeriodRevenue
    const { data: sInvData } = useEtherSWR([
        [sinvAddress, 'totalSupply'],
        [sinvAddress, 'periodRevenue'],
        [sinvAddress, 'lastPeriodRevenue'],        
        [sinvAddress, 'totalAssets'],
        [sinvAddress, 'lastBuyPeriod'],
        [sinvAddress, 'depositLimit'],
    ]);

    const { data: depositLimitBn } = useEtherSWR(
        [sinvAddress, 'depositLimit'],
    );
    
    const invStakingData = metaData && sInvData ? metaData.concat(sInvData) : undefined;

    return {
        ...formatInvStakingData(dbrDolaPrice, invStakingData, firmInvApr, dbrInvExRate, invStakedViaDistributor, apiData, supplyDelta, version),
        depositLimit: depositLimitBn ? getBnToNumber(depositLimitBn) : 0,
        isLoading: (!invStakingData && !error) && (!apiData && !apiErr),
        hasError: !!error || !!apiErr,
    }
}

export const formatInvStakingData = (
    dbrDolaPrice: number,
    invStakingData: any[],
    firmInvApr: number,    
    dbrInvExRate: number,
    invStakedViaDistributor: number,
    fallbackData?: any,
    supplyDelta = 0,
    version = 'V2',
) => {
    const fallbackDataVersioned = version === 'V1' ? fallbackData?.V1 : fallbackData;
    const sInvClaimable = invStakingData ? getBnToNumber(invStakingData[0]) : fallbackDataVersioned?.sInvClaimable || 0;
    const invBalInFirmFromSInv = invStakingData ? getBnToNumber(invStakingData[1]) : fallbackDataVersioned?.invBalInFirmFromSInv || 0;
    const distributorTotalSupply = (invStakingData ? getBnToNumber(invStakingData[2]) : fallbackDataVersioned?.distributorTotalSupply || 0) + supplyDelta;

    const distributorYearlyBudget = invStakingData ? getBnToNumber(invStakingData[3]) * ONE_DAY_SECS * 365 : fallbackDataVersioned?.distributorYearlyBudget || 0;
    const maxYearlyRewardBudget = invStakingData ? getBnToNumber(invStakingData[4]) * ONE_DAY_SECS * 365 : fallbackDataVersioned?.maxYearlyRewardBudget || 0;
    const sInvSupply = (invStakingData ? getBnToNumber(invStakingData[5]) : fallbackDataVersioned?.sInvSupply || 0);
    const _periodRevenue = invStakingData ? getBnToNumber(invStakingData[6]) : fallbackDataVersioned?.periodRevenue || 0;
    const _pastPeriodRevenue = invStakingData ? getBnToNumber(invStakingData[7]) : fallbackDataVersioned?.pastPeriodRevenue || 0;
    const sInvTotalAssetsCurrent = (invStakingData ? getBnToNumber(invStakingData[8]) : fallbackDataVersioned?.sInvTotalAssets || 0);
    const lastBuyPeriod = (invStakingData ? getBnToNumber(invStakingData[9], 0) : fallbackDataVersioned?.lastBuyPeriod || 0);
    const sInvTotalAssets = sInvTotalAssetsCurrent + supplyDelta;

    const weekUtcIndex = getWeekIndexUtc();
    const weekUtcIndexPrev = weekUtcIndex - 1;
    const periodRevenue = !lastBuyPeriod || lastBuyPeriod === weekUtcIndex ? _periodRevenue : 0;
    const pastPeriodRevenue = !lastBuyPeriod || lastBuyPeriod === weekUtcIndex ? _pastPeriodRevenue : lastBuyPeriod === weekUtcIndexPrev ? _periodRevenue : 0;

    const sInvDistributorShare = invStakedViaDistributor > 0 ? invBalInFirmFromSInv / invStakedViaDistributor : 1;
    // sDOLA budget share
    const yearlyRewardBudget = sInvDistributorShare > 0 ? distributorYearlyBudget * sInvDistributorShare : distributorYearlyBudget;
    const distributorDbrRatePerInv = invStakedViaDistributor > 0 ? distributorYearlyBudget / invStakedViaDistributor : 0;
    const dbrRatePerInv = invBalInFirmFromSInv > 0 ? yearlyRewardBudget / invBalInFirmFromSInv : 0;
    const now = Date.now();
    const secondsPastEpoch = (now - getLastThursdayTimestamp()) / 1000;
    const realizedTimeInDays = secondsPastEpoch / ONE_DAY_SECS;
    const periodAntiDilutionRewards = (sInvTotalAssets * firmInvApr/100)/365*7;
    const nextTotalAssetsWithDbr = sInvTotalAssets + periodRevenue;
    const nextTotalAssets = sInvTotalAssets + periodAntiDilutionRewards + periodRevenue;
    const realized = ((periodRevenue / realizedTimeInDays) * 365) / sInvTotalAssets;
    // forecasted = dbrApr at next period  
    const forecasted = (nextTotalAssetsWithDbr * dbrInvExRate * dbrRatePerInv) / sInvTotalAssets;

    // const forecasted = distributorYearlyBudget * dbrInvExRate / (invStakedViaDistributor+periodAntiDilutionRewards+periodRevenue);
    // we use two week revenu epoch for the projected auctionApr
    const calcPeriodSeconds = 14 * ONE_DAY_SECS;
    const projectedApr = dbrDolaPrice ?
        ((secondsPastEpoch / calcPeriodSeconds) * realized + ((calcPeriodSeconds - secondsPastEpoch) / calcPeriodSeconds) * forecasted) * 100 : 0;
    
    const auctionApr = sInvTotalAssets > 0 ? (pastPeriodRevenue * WEEKS_PER_YEAR) / sInvTotalAssets * 100 : 0;
    const nextAuctionApr = sInvTotalAssets > 0 ? (periodRevenue * WEEKS_PER_YEAR) / sInvTotalAssets * 100 : 0;
    const sInvExRate = sInvTotalAssetsCurrent && sInvSupply ? sInvTotalAssetsCurrent / sInvSupply : 1;
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
        invStakedViaDistributor,
        // assumes daily auto-compounding
        apy: aprToApy(auctionApr, 365) + firmInvApr,
        nextAuctionApr,
        nextAuctionApy: aprToApy(nextAuctionApr, WEEKS_PER_YEAR),
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
        .map((e, i) => ({...e, key: `${e.txHash}-${i}`, version: e.version || 'V1' }));
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
    const { data, error } = useCacheFirstSWR(`/api/inv-staking/history?v=1.0.4`, fetcher);

    const evolution = useMemo(() => {
        return (data?.totalEntries || []).map((e) => ({ 
            ...e,
            tvl: e.sInvTotalAssets * (e.invMarketPrice || 22),
         }));
    }, [data?.timestamp, data?.totalEntries]);

    return {
        evolution,
        timestamp: data ? data.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

export const useInvStakingEvents = (version = 'V2') => {   
    const { events: depositEventsData } = useContractEvents(
        VERSIONED_ADDRESSES[version].sinv,
        SINV_ABI,
        'Deposit',
    );
    const { events: withdrawEventsData } = useContractEvents(
        VERSIONED_ADDRESSES[version].sinv,
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
            version: e.address.toLowerCase() === SINV_ADDRESS_V1.toLowerCase() ? 'V1' : 'V2',
        };
    });
}