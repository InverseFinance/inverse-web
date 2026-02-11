import { DBR_AUCTION_ABI, DBR_AUCTION_HELPER_ABI, INV_BUY_BACK_AUCTION_HELPER_ABI, SINV_ABI } from "@app/config/abis";
import { useContractEvents } from "@app/hooks/useContractEvents";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { ascendingEventsSorter, getTimestampFromUTCDate, timestampToUTC } from "./misc";
import { useBlocksTimestamps } from "@app/hooks/useBlockTimestamp";
import { getBnToNumber, getNumberToBn } from "./markets";
import { useCacheFirstSWR, useCustomSWR, useLocalCacheOnly } from "@app/hooks/useCustomSWR";
import { SWR } from "@app/types";
import { fetcher } from "./web3";
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS, INV_BUY_BACK_AUCTION_HELPER, SDOLA_ADDRESS, SINV_ADDRESS } from "@app/config/constants";
import useEtherSWR from "@app/hooks/useEtherSWR";
import { parseEther } from "@ethersproject/units";
import { useEffect, useState } from "react";
import { useDbrAuction } from "@app/components/F2/DbrAuction/DbrAuctionInfos";

export const getDbrAuctionContract = (signerOrProvider: JsonRpcSigner, auctionAddress = DBR_AUCTION_ADDRESS) => {
    return new Contract(auctionAddress, DBR_AUCTION_ABI, signerOrProvider);
}

export const getDbrAuctionHelperContract = (signerOrProvider: JsonRpcSigner, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    return new Contract(helperAddress, DBR_AUCTION_HELPER_ABI, signerOrProvider);
}

export const getInvBuyBackAuctionHelperContract = (signerOrProvider: JsonRpcSigner, helperAddress = INV_BUY_BACK_AUCTION_HELPER) => {
    return new Contract(helperAddress, INV_BUY_BACK_AUCTION_HELPER_ABI, signerOrProvider);
}

export const sellDolaForDbr = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber, auctionAddress = DBR_AUCTION_ADDRESS) => {
    const contract = getDbrAuctionContract(signerOrProvider, auctionAddress);
    return contract.buyDBR(dolaToSell, minDbrOut, await signerOrProvider.getAddress());
}

export const swapExactDolaForDbr = (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.swapExactDolaForDbr(dolaToSell, minDbrOut);
}

export const swapExactSDolaForDbr = (signerOrProvider: JsonRpcSigner, sDolaToSell: BigNumber, minDbrOut: BigNumber, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.swapExactsDolaForDbr(sDolaToSell, minDbrOut);
}

export const swapDolaForExactDbr = (signerOrProvider: JsonRpcSigner, dolaInMax: BigNumber, dbrOut: BigNumber, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.swapDolaForExactDbr(dbrOut, dolaInMax);
}

export const getDbrOut = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.getDbrOut(dolaToSell);
}

export const buyBackInvForDbr = (signerOrProvider: JsonRpcSigner, invToSell: BigNumber, minDbrOut: BigNumber, helperAddress = INV_BUY_BACK_AUCTION_HELPER) => {
    const contract = getInvBuyBackAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.swapExactAssetForDbr(invToSell, minDbrOut);
}

const estimateFuturAuctionDbrPrice = (
    currentDolaReserve: number,
    currentDbrReserve: number,
    dbrRatePerYear: number,
    timeToAddSec: number
): number => {
    const K = currentDolaReserve * currentDbrReserve;
    const oneYearSec = 31536000
    const newDbrIn = timeToAddSec * dbrRatePerYear / oneYearSec;
    const futurDbrReserve = currentDbrReserve + newDbrIn;
    const futurDolaReserve = K / futurDbrReserve;

    const numerator = 1 * futurDbrReserve;
    const denominator = futurDolaReserve + 1;
    const dbrOutForOneDola = numerator / denominator;
    const dbrDolaPrice = 1 / dbrOutForOneDola;
    return dbrDolaPrice;
}
// binary search
export const estimateAuctionTimeToReachMarketPrice = (
    currentDolaReserve: number,
    currentDbrReserve: number,
    dbrRatePerYear: number,
    targetDbrDolaPrice: number,
): number => {
    const oneYearSec = 31536000;
    let timeToAddSec = 0;
    let step = oneYearSec;  // Start with a large step size
    let dbrDolaPrice;

    // Iteratively adjust timeToAddSec to find the target price
    for (let i = 0; i < 1000; i++) { // Limit iterations to prevent infinite loops
        dbrDolaPrice = estimateFuturAuctionDbrPrice(currentDolaReserve, currentDbrReserve, dbrRatePerYear, timeToAddSec);

        if (Math.abs(dbrDolaPrice - targetDbrDolaPrice) < 0.001) {
            // Close enough to the target price
            return timeToAddSec;
        }

        // Adjust timeToAddSec based on whether we are above or below the target price
        if (dbrDolaPrice > targetDbrDolaPrice) {
            timeToAddSec += step;
        } else {
            timeToAddSec -= step;
        }

        // Reduce step size to refine the approximation
        step /= 2;
    }

    return timeToAddSec;
}

export const formatDailyAuctionAggreg = (e: any, i: number) => {
    const isInvCase = e.auctionType === 'sINV';
    const priceInDola = ((e.dolaIn || 0) / e.dbrOut);
    const priceInInv = ((e.invIn || 0) / e.dbrOut);
    const amountIn = isInvCase ? e.invIn : e.dolaIn;
    const arb = isInvCase ? e.marketPriceInInv - priceInInv : e.marketPriceInDola - priceInDola;
    const worthIn = e.dolaIn ? e.dolaIn : e.invIn * 1 / e.marketPriceInInv * e.marketPriceInDola;
    const worthOut = e.dbrOut * e.marketPriceInDola;
    const priceAvg = isInvCase ? (priceInInv + e.marketPriceInInv) / 2 : (priceInDola + e.marketPriceInDola) / 2;
    return {
        timestamp: e.timestamp,
        auctionType: e.auctionType,
        price: isInvCase ? priceInInv : priceInDola,
        marketPrice: isInvCase ? e.marketPriceInInv : e.marketPriceInDola,
        amountIn,
        worthIn,
        worthOut,
        arb,
        dbrOut: e.dbrOut,
        arbPerc: arb / (priceAvg) * 100,
    };
}

export const formatAuctionEvents = (e: any, i: number) => {
    const isInvCase = e.auctionType === 'sINV';
    const priceInDola = ((e.dolaIn || 0) / e.dbrOut);
    const priceInInv = ((e.invIn || 0) / e.dbrOut);
    const amountIn = isInvCase ? e.invIn : e.dolaIn;
    const arb = isInvCase ? e.marketPriceInInv - priceInInv : e.marketPriceInDola - priceInDola;
    const worthIn = e.dolaIn ? e.dolaIn : e.invIn * 1 / e.marketPriceInInv * e.marketPriceInDola;
    const worthOut = e.dbrOut * e.marketPriceInDola;
    const priceAvg = isInvCase ? (priceInInv + e.marketPriceInInv) / 2 : (priceInDola + e.marketPriceInDola) / 2;
    return {
        ...e,
        key: `${e.txHash}-${i}`,
        priceInDola,
        priceInInv,
        amountIn,
        worthIn,
        worthOut,
        arb,
        arbPerc: arb / (priceAvg) * 100,
        version: e.version || (isInvCase ? 'V1' : undefined),
    };
}

const aggregByDay = (formattedEvents: any[], utcDate: string, archivedDailyBuy: any = {}) => {
    const list = formattedEvents.filter(e => e.utcDate === utcDate);
    const accAmountIn = list.reduce((prev, curr) => prev + curr.amountIn || 0, (archivedDailyBuy?.amountIn || 0));
    const accDbrOut = list.reduce((prev, curr) => prev + curr.dbrOut || 0, (archivedDailyBuy?.dbrOut || 0));
    const nbBuys = list.length;
    const price = nbBuys ? list.reduce((prev, curr) => prev + curr.price || 0, 0) / nbBuys : 0;
    const marketPrice = nbBuys ? list.reduce((prev, curr) => prev + curr.marketPrice || 0, 0) / nbBuys : 0;
    return {
        amountIn: accAmountIn,
        dbrOut: accDbrOut,
        worthIn: list.reduce((prev, curr) => prev + curr.worthIn || 0, archivedDailyBuy?.worthIn || 0),
        worthOut: list.reduce((prev, curr) => prev + curr.worthOut || 0, archivedDailyBuy?.worthOut || 0),
        // avgDbrPrice: accDbrOut ? accAmountIn / accDbrOut : 0,
        // arb: nbBuys ? list.reduce((prev, curr) => prev + curr.arb || 0, 0) / nbBuys : 0,
        arbPercMin: nbBuys ? list.reduce((prev, curr) => Math.min(prev, curr.arbPerc||0), archivedDailyBuy?.arbPercMin || Infinity) : archivedDailyBuy?.arbPercMin || 0,    
        arbPercMax: nbBuys ? list.reduce((prev, curr) => Math.max(prev, curr.arbPerc||0), archivedDailyBuy?.arbPercMax || 0) : archivedDailyBuy?.arbPercMax || 0,    
        nbBuys: nbBuys + (archivedDailyBuy?.nbBuys || 0),
        price: archivedDailyBuy?.price && price ? (price+archivedDailyBuy.price)/2 : archivedDailyBuy?.price || price || 0,
        marketPrice: archivedDailyBuy?.marketPrice && marketPrice ? (marketPrice+archivedDailyBuy.marketPrice)/2 : archivedDailyBuy?.marketPrice || marketPrice || 0,
    }
}

export const getGroupedByDayAuctionBuys = (buyEvents: any[], archivedDailyBuys: any[] = []) => {
    const events = buyEvents.map(e => {
        return {
            utcDate: timestampToUTC(e.timestamp),
            ...e,
        }
    });

    const types = ['Virtual', 'sDOLA', 'sINV'];
    const uniqueDays = [...new Set([...archivedDailyBuys.map(e => e.utcDate), ...events.map(e => e.utcDate)])];

    return uniqueDays.map((utcDateString,i) => {
        const archivedDailyBuy = archivedDailyBuys.find(e => e.utcDate === utcDateString);
        const newDailyBuyEvent = events.find(e => e.utcDate === utcDateString);

        if(!newDailyBuyEvent){
            return archivedDailyBuy;
        }

        const aggregatedTypes = types.reduce((prev, type) => {
            const list = events.filter(e => e.auctionType === type);
            const aggreg = aggregByDay(list, utcDateString, archivedDailyBuy?.[type]);
            return {
                ...prev,
                [type]: aggreg,
            }
        }, {});
        const allList = events.filter(e => e.utcDate === utcDateString);
        const all = aggregByDay(allList, utcDateString, archivedDailyBuy?.all);
        return {
            utcDate: utcDateString,
            timestamp: getTimestampFromUTCDate(utcDateString),
            all: {
                worthIn: all.worthIn,
                worthOut: all.worthOut,
                nbBuys: all.nbBuys,
                dbrOut: all.dbrOut,
            },
            ...aggregatedTypes,
        }
    });
}

export const getFormattedAuctionBuys = (events: any[]) => {
    // combines both daily DOLA types auctions aggregs into one
    const dolaEvents = events.map(e => {
        const whichIsMax = e.Virtual.arbPercMax > e.sDOLA.arbPercMax ? 'Virtual' : 'sDOLA';
        return {
            ...e,
            amountIn: e.Virtual.amountIn + e.sDOLA.amountIn,
            dbrOut: e.Virtual.dbrOut + e.sDOLA.dbrOut,
            worthIn: e.Virtual.worthIn + e.sDOLA.worthIn,
            worthOut: e.Virtual.worthOut + e.sDOLA.worthOut,
            // avgDbrPrice: (e.Virtual.dbrOut + e.sDOLA.dbrOut) > 0 ? (e.Virtual.amountIn + e.sDOLA.amountIn) / (e.Virtual.dbrOut + e.sDOLA.dbrOut) : 0,
            arbPercMax: Math.max(e.Virtual.arbPercMax, e.sDOLA.arbPercMax),
            arbPercMin: Math.min(e.Virtual.arbPercMin, e.sDOLA.arbPercMin),
            price: e[whichIsMax].price,
            marketPrice: e[whichIsMax].marketPrice,
            nbBuys: e.Virtual.nbBuys + e.sDOLA.nbBuys,   
        }
    });
    
    const sinvAuctionEvents = events.map(e => ({...e, ...e.sINV}));
    const virtualAuctionEvents = events.map(e => ({...e, ...e.Virtual}));
    const sdolaAuctionEvents = events.map(e => ({...e, ...e.sDOLA}));

    const accDolaIn = dolaEvents.reduce((prev, curr) => prev + curr.amountIn || 0, 0);
    const accInvWorthIn = sinvAuctionEvents.reduce((prev, curr) => prev + curr.worthIn || 0, 0);
    const accWorthIn = events.reduce((prev, curr) => prev + curr.all.worthIn || 0, 0);
    const accWorthOut = events.reduce((prev, curr) => prev + curr.all.worthOut || 0, 0);
    const accDolaWorthOut = dolaEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
    const accVirtualWorthOut = virtualAuctionEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
    const accSdolaWorthOut = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
    const accInvWorthOut = sinvAuctionEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
    const accDbrOutFromDola = dolaEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);
    const accDbrOut = events.reduce((prev, curr) => prev + curr.all.dbrOut, 0);

    const accDolaInVirtual = virtualAuctionEvents.reduce((prev, curr) => prev + curr.amountIn || 0, 0);
    const accDbrOutVirtual = virtualAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut || 0, 0);

    const accDolaInSdola = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.amountIn || 0, 0);
    const accDbrOutSdola = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut || 0, 0);

    const accInvInSinv = sinvAuctionEvents.reduce((prev, curr) => prev + curr.amountIn || 0, 0);
    const accDbrOutSinv = sinvAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut || 0, 0);
    const accInvIn = accInvInSinv;

    const avgDbrPrice = accDolaIn / accDbrOutFromDola;
    const nbBuys = events.reduce((prev, curr) => prev + curr.all.nbBuys, 0);

    return {
        events,
        dolaEvents,
        virtualAuctionEvents,
        sdolaAuctionEvents,
        sinvAuctionEvents,
        aggregated: {
            accDolaIn,
            accDbrOut,
            accDolaInVirtual,
            accDbrOutVirtual,
            accDolaInSdola,
            accDbrOutSdola,
            accInvInSinv,
            accDbrOutSinv,
            accDbrOutFromDola,
            accInvIn,
            accInvWorthIn,
            accWorthIn,
            accInvWorthOut,
            accWorthOut,
            accDolaWorthOut,
            accVirtualWorthOut,
            accSdolaWorthOut,
            avgDbrPrice,
            nbBuys,
        }
    }
}

export const useDbrAuctionActivity = (from?: string): SWR & {
    events: any[],
    dolaEvents: any[],
    invEvents: any[],
    virtualAuctionEvents: any[],
    sdolaAuctionEvents: any[],
    sinvAuctionEvents: any[],
    accountEvents: any,
    timestamp: number,
    dbrSaleHandlerRepayPercentage: number,
    avgDbrPrice: number,
    nbBuys: number,
    accDolaIn: number,
    accDbrOut: number,
    accDolaInVirtual: number,
    accDolaInSdola: number,
    accDbrOutVirtual: number,
    accDbrOutSdola: number,
    accInvInSinv: number,
    accDbrOutSinv: number,
    accDbrOutFromDola: number,
    accInvIn: number,
    accInvWorthIn: number,
    accWorthIn: number,
    accInvWorthOut: number,
    accWorthOut: number,
    accDolaWorthOut: number,
    accVirtualWorthOut: number,
    accSdolaWorthOut: number,
    last100: any[],
    last100VirtualAuctionEvents: any[],
    last100SdolaAuctionEvents: any[],
    last100SinvAuctionEvents: any[],
} => {
    const { data, error } = useCustomSWR(`/api/auctions/dbr-buys?v=4`, fetcher);

    const { events, dolaEvents, virtualAuctionEvents, sdolaAuctionEvents, sinvAuctionEvents, aggregated } = getFormattedAuctionBuys(data?.dailyBuys || []);

    return {
        events,
        dolaEvents,
        virtualAuctionEvents,
        sdolaAuctionEvents,
        sinvAuctionEvents,
        last100: (data?.last100 || []).map(formatAuctionEvents),
        last100VirtualAuctionEvents: (data?.last100VirtualAuctionEvents || []).map(formatAuctionEvents),
        last100SdolaAuctionEvents: (data?.last100SdolaAuctionEvents || []).map(formatAuctionEvents),
        last100SinvAuctionEvents: (data?.last100SinvAuctionEvents || []).map(formatAuctionEvents),
        // accountEvents: events.filter(e => e.to === from),
        ...aggregated,
        dbrSaleHandlerRepayPercentage: data?.dbrSaleHandlerRepayPercentage || 20,
        timestamp: !from ? data?.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

// export const useDbrAuctionActivity = (from?: string): SWR & {
//     events: any[],
//     dolaEvents: any[],
//     virtualAuctionEvents: any[],
//     sdolaAuctionEvents: any[],
//     sinvAuctionEvents: any[],
//     accountEvents: any,
//     timestamp: number,
//     dbrSaleHandlerRepayPercentage: number,
//     avgDbrPrice: number,
//     nbBuys: number,
//     accDolaIn: number,
//     accDbrOut: number,
//     accDolaInVirtual: number,
//     accDolaInSdola: number,
//     accDbrOutVirtual: number,
//     accDbrOutSdola: number,
//     accInvInSinv: number,
//     accDbrOutSinv: number,
//     accDbrOutFromDola: number,
//     accInvIn: number,
//     accInvWorthIn: number,
//     accWorthIn: number,
//     accInvWorthOut: number,
//     accWorthOut: number,
//     accDolaWorthOut: number,
//     accVirtualWorthOut: number,
//     accSdolaWorthOut: number,
//     last100: any[],
//     last100VirtualAuctionEvents: any[],
//     last100SdolaAuctionEvents: any[],
//     last100SinvAuctionEvents: any[],
// } => {
//     const liveEvents = []//useDbrAuctionBuyEvents(from);
//     const { data, error } = useCacheFirstSWR(`/api/auctions/dbr-buys?v=2.0.0`, fetcher);

//     const events = (liveEvents?.length > data?.buys?.length ? liveEvents : data?.buys || [])
//         .map(formatAuctionEvents)

//     const dolaEvents = events.filter(e => e.auctionType === 'Virtual' || e.auctionType === 'sDOLA');
//     const virtualAuctionEvents = events.filter(e => e.auctionType === 'Virtual');
//     const sdolaAuctionEvents = events.filter(e => e.auctionType === 'sDOLA');
//     const sinvAuctionEvents = events.filter(e => e.auctionType === 'sINV');

//     const accDolaIn = dolaEvents.reduce((prev, curr) => prev + curr.dolaIn || 0, 0);
//     const accInvWorthIn = sinvAuctionEvents.reduce((prev, curr) => prev + curr.worthIn || 0, 0);
//     const accWorthIn = events.reduce((prev, curr) => prev + curr.worthIn || 0, 0);
//     const accWorthOut = events.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
//     const accDolaWorthOut = dolaEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
//     const accVirtualWorthOut = virtualAuctionEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
//     const accSdolaWorthOut = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
//     const accInvWorthOut = sinvAuctionEvents.reduce((prev, curr) => prev + curr.worthOut || 0, 0);
//     const accDbrOutFromDola = dolaEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);
//     const accDbrOut = events.reduce((prev, curr) => prev + curr.dbrOut, 0);

//     const accDolaInVirtual = virtualAuctionEvents.reduce((prev, curr) => prev + curr.dolaIn || 0, 0);
//     const accDbrOutVirtual = virtualAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);

//     const accDolaInSdola = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.dolaIn || 0, 0);
//     const accDbrOutSdola = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);

//     const accInvInSinv = sinvAuctionEvents.reduce((prev, curr) => prev + curr.invIn || 0, 0);
//     const accDbrOutSinv = sinvAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);
//     const accInvIn = accInvInSinv;

//     const avgDbrPrice = accDolaIn / accDbrOutFromDola;
//     const nbBuys = events.length;

//     return {
//         events,
//         dolaEvents,
//         virtualAuctionEvents,
//         sdolaAuctionEvents,
//         sinvAuctionEvents,
//         last100: (data?.last100 || []).map(formatAuctionEvents),
//         last100VirtualAuctionEvents: (data?.last100VirtualAuctionEvents || []).map(formatAuctionEvents),
//         last100SdolaAuctionEvents: (data?.last100SdolaAuctionEvents || []).map(formatAuctionEvents),
//         last100SinvAuctionEvents: (data?.last100SinvAuctionEvents || []).map(formatAuctionEvents),
//         accountEvents: events.filter(e => e.to === from),
//         nbBuys,
//         avgDbrPrice,
//         accDolaIn,
//         accDbrOut,
//         accDolaInVirtual,
//         accDbrOutVirtual,
//         accDolaInSdola,
//         accDbrOutSdola,
//         accInvInSinv,
//         accDbrOutSinv,
//         accDbrOutFromDola,
//         accInvIn,
//         accWorthIn,
//         accInvWorthIn,
//         accInvWorthOut,
//         accWorthOut,
//         accDolaWorthOut,
//         accVirtualWorthOut,
//         accSdolaWorthOut,
//         dbrSaleHandlerRepayPercentage: data?.dbrSaleHandlerRepayPercentage || 20,
//         timestamp: !from ? data?.timestamp : 0,
//         isLoading: !error && !data,
//         isError: error,
//     }
// }

// export const useDbrAuctionBuyEvents = (account: string) => {
//     const { events: generalAuctionBuys } = useContractEvents(
//         DBR_AUCTION_ADDRESS,
//         DBR_AUCTION_ABI,
//         'Buy',
//         !!account ? [undefined, account] : undefined,
//     );
//     const { events: sdolaAuctionBuys } = useContractEvents(
//         SDOLA_ADDRESS,
//         DBR_AUCTION_ABI,
//         'Buy',
//         !!account ? [undefined, account] : undefined,
//     );
//     const { events: sinvAuctionBuys } = useContractEvents(
//         SINV_ADDRESS,
//         SINV_ABI,
//         'Buy',
//         !!account ? [undefined, account] : undefined,
//     );
//     const buyEvents = generalAuctionBuys.concat(sdolaAuctionBuys).concat(sinvAuctionBuys);
//     buyEvents.sort(ascendingEventsSorter);
//     const uniqueBlocks = [...new Set(buyEvents.map(e => e.blockNumber))];
//     const { timestamps } = useBlocksTimestamps(uniqueBlocks);
//     const timestampsAsObj = timestamps.reduce((prev, curr, i) => ({ ...prev, [uniqueBlocks[i]]: curr / 1000 }), {});
//     return formatDbrAuctionBuys(buyEvents, timestampsAsObj);
// }

// export const formatDbrAuctionBuys = (events: any[], timestamps?: any) => {
//     let totalBuys = 0;
//     return events.map(e => {
//         const amount = getBnToNumber(e.args.amount || e.args.assets || e.args.dolaIn || e.args.invIn || '0');
//         totalBuys += amount;
//         const isSinv = e.address === SINV_ADDRESS;
//         return {
//             txHash: e.transactionHash,
//             timestamp: timestamps ? timestamps[e.blockNumber] * 1000 : undefined,
//             blockNumber: e.blockNumber,
//             caller: e.args[0],
//             to: e.args[1],
//             invIn: isSinv ? getBnToNumber(e.args[2]) : 0,
//             dolaIn: isSinv ? 0 : getBnToNumber(e.args[2]),
//             dbrOut: getBnToNumber(e.args[3]),
//             auctionType: e.address === SDOLA_ADDRESS ? 'sDOLA' : isSinv ? 'sINV' : 'Virtual',
//         };
//     });
// }

const defaultRefClassicAmount = '1';
const defaultRefSdolaAmount = '0.999';

export const useDbrAuctionPricing = ({
    tokenAmount,
    dbrAmount,
    helperAddress,
    slippage,
    isExactToken,
    dbrSwapPriceRefInToken,
    auctionType = 'classic',
}: {
    tokenAmount: string,
    dbrAmount: string,
    helperAddress: string,
    slippage: string,
    isExactToken: boolean,
    dbrSwapPriceRefInToken: number,
    auctionType: 'classic' | 'sdola' | 'sinv' | 'jdola',
}) => {
    const [estimatedTimeToReachMarketPrice, setEstimatedTimeToReachMarketPrice] = useState(0);
    const isClassicDbrAuction = auctionType === 'classic';
    const defaultRefAmount = isClassicDbrAuction ? defaultRefClassicAmount : defaultRefSdolaAmount;
    const { tokenReserve, dbrReserve, dbrRatePerYear } = useDbrAuction(auctionType);
    const isSinvAuction = auctionType === 'sinv';

    const { data: dataOut, error } = useEtherSWR([
        [helperAddress, 'getDbrOut', parseEther(tokenAmount || defaultRefAmount)],
        [helperAddress, 'getDbrOut', parseEther(defaultRefAmount)],
    ]);
    
    const { data: dataIn } = useEtherSWR([
        [helperAddress, isSinvAuction ? 'getInvIn' : 'getDolaIn', parseEther(dbrAmount || defaultRefAmount)],
        [helperAddress, isSinvAuction ? 'getInvIn' : 'getDolaIn', parseEther(defaultRefAmount)],
    ]);

    const isLoading = (!dataOut && !error);
    const refDbrOut = dataOut && dataOut[1] ? getBnToNumber(dataOut[1]) : 0;
    const estimatedDbrOut = dataOut && dataOut[0] && !!tokenAmount ? getBnToNumber(dataOut[0]) : 0;
    const minDbrOut = dataOut && dataOut[0] ? getNumberToBn(estimatedDbrOut * (1 - parseFloat(slippage) / 100)) : BigNumber.from('0');

    const refTokenIn = dataIn && dataIn[1] ? getBnToNumber(dataIn[1]) : 0;
    const refAuctionPriceInToken = dataOut ? parseFloat(defaultRefAmount) / refDbrOut : 0;

    const estimatedTokenIn = dataIn && dataIn[0] && !!dbrAmount ? getBnToNumber(dataIn[0]) : 0;
    const maxTokenIn = dataIn && dataIn[0] ? getNumberToBn(estimatedTokenIn * (1 + parseFloat(slippage) / 100)) : BigNumber.from('0');

    const minDbrOutNum = getBnToNumber(minDbrOut);
    const maxTokenInNum = getBnToNumber(maxTokenIn);

    const dbrAuctionPrice = isExactToken ?
        (estimatedDbrOut > 0 ? estimatedDbrOut / parseFloat(tokenAmount) : refDbrOut / parseFloat(defaultRefAmount))
        :
        (estimatedTokenIn > 0 ? parseFloat(dbrAmount) / estimatedTokenIn : refTokenIn > 0 ? parseFloat(defaultRefAmount) / refTokenIn : 0);

    const dbrAuctionPriceInToken = dbrAuctionPrice ? 1 / dbrAuctionPrice : 0;
    const estimatedTimestampToReachMarketPrice = (estimatedTimeToReachMarketPrice * 1000) + Date.now();

    useEffect(() => {
        if (!dbrSwapPriceRefInToken || !tokenReserve || !dbrRatePerYear || !dbrReserve) return;
        if (dbrSwapPriceRefInToken > refAuctionPriceInToken) {
            setEstimatedTimeToReachMarketPrice(0);
            return;
        }
        setEstimatedTimeToReachMarketPrice(
            estimateAuctionTimeToReachMarketPrice(tokenReserve, dbrReserve, dbrRatePerYear, dbrSwapPriceRefInToken)
        );
    }, [dbrSwapPriceRefInToken, refAuctionPriceInToken, tokenReserve, dbrReserve, dbrRatePerYear]);

    return {
        isLoading,
        estimatedTimestampToReachMarketPrice,
        estimatedTimeToReachMarketPrice,
        dbrSwapPriceRefInToken,
        dbrAuctionPriceInToken,
        minDbrOutNum,
        maxTokenInNum,
        minDbrOut,
        maxTokenIn,
        helperAddress,
        isClassicDbrAuction,
        estimatedTokenIn,
        estimatedDbrOut,
    }
}