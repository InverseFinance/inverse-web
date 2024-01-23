import { DBR_AUCTION_ABI, DBR_AUCTION_HELPER_ABI } from "@app/config/abis";
import { useContractEvents } from "@app/hooks/useContractEvents";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { ascendingEventsSorter } from "./misc";
import { useBlocksTimestamps } from "@app/hooks/useBlockTimestamp";
import { getBnToNumber } from "./markets";
import { useCustomSWR } from "@app/hooks/useCustomSWR";
import { SWR } from "@app/types";
import { fetcher } from "./web3";

export const DBR_AUCTION_ADDRESS = '0x933cBE81313d9dD523dF6dC9B899A7AF8Ba073e3';
export const DBR_AUCTION_HELPER_ADDRESS = '0xC7D5E6FA4D5B4b4A82b14a256008DAfAF5232ADb';

export const getDbrAuctionContract = (signerOrProvider: JsonRpcSigner, auctionAddress = DBR_AUCTION_ADDRESS) => {
    return new Contract(auctionAddress, DBR_AUCTION_ABI, signerOrProvider);
}

export const getDbrAuctionHelperContract = (signerOrProvider: JsonRpcSigner, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    return new Contract(helperAddress, DBR_AUCTION_HELPER_ABI, signerOrProvider);
}

export const sellDolaForDbr = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber, auctionAddress = DBR_AUCTION_ADDRESS) => {
    const contract = getDbrAuctionContract(signerOrProvider, auctionAddress);
    return contract.buyDBR(dolaToSell, minDbrOut, await signerOrProvider.getAddress());
}

export const swapExactDolaForDbr = (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, minDbrOut: BigNumber, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.swapExactDolaForDbr(dolaToSell, minDbrOut);
}

export const swapDolaForExactDbr = (signerOrProvider: JsonRpcSigner, dolaInMax: BigNumber, dbrOut: BigNumber, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.swapDolaForExactDbr(dbrOut, dolaInMax);
}

export const getDbrOut = async (signerOrProvider: JsonRpcSigner, dolaToSell: BigNumber, helperAddress = DBR_AUCTION_HELPER_ADDRESS) => {
    const contract = getDbrAuctionHelperContract(signerOrProvider, helperAddress);
    return contract.getDbrOut(dolaToSell);
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

export const useDbrAuctionActivity = (from?: string): SWR & {
    events: any,
    accountEvents: any,    
    timestamp: number,
    avgDbrPrice: number,
    nbBuys: number,
    accDolaIn: number,
    accDbrOut: number,
} => {
    const liveEvents = useDbrAuctionBuyEvents(from);    
    const { data, error } = useCustomSWR(`/api/auctions/dbr-buys`, fetcher);

    const events = (liveEvents || data?.buys || []).map(e => ({ ...e, priceInDola: (e.dolaIn / e.dbrOut) }));
    const accDolaIn = events.reduce((prev, curr) => prev + curr.dolaIn, 0);
    const accDbrOut = events.reduce((prev, curr) => prev + curr.dbrOut, 0);
    const avgDbrPrice = accDolaIn / accDbrOut;
    const nbBuys = events.length;

    return {
        events,
        accountEvents: events.filter(e => e.to === from),
        nbBuys,
        avgDbrPrice,
        accDolaIn,
        accDbrOut,
        timestamp: !from ? data?.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

export const useDbrAuctionBuyEvents = (account: string) => {
    const { events: buyEventsData } = useContractEvents(
        DBR_AUCTION_ADDRESS,
        DBR_AUCTION_ABI,
        'Buy',
        !!account ? [undefined, account] : undefined,
    );
    const eventsData = buyEventsData;
    const sortedEvents = eventsData.sort(ascendingEventsSorter);
    const uniqueBlocks = [...new Set(sortedEvents.map(e => e.blockNumber))];
    const { timestamps } = useBlocksTimestamps(uniqueBlocks);
    const timestampsAsObj = timestamps.reduce((prev, curr, i) => ({ ...prev, [uniqueBlocks[i]]: curr / 1000 }), {});
    return formatDbrAuctionBuys(sortedEvents, timestampsAsObj);
}

export const formatDbrAuctionBuys = (events: any[], timestamps?: any, alreadyBought = 0) => {
    let totalBuys = alreadyBought;
    return events.map(e => {
        const amount = getBnToNumber(e.args.amount || e.args.assets || '0');
        totalBuys += amount;
        return {
            txHash: e.transactionHash,
            timestamp: timestamps ? timestamps[e.blockNumber] * 1000 : undefined,
            blockNumber: e.blockNumber,
            caller: e.args[0],
            to: e.args[1],
            dolaIn: getBnToNumber(e.args[2]),
            dbrOut: getBnToNumber(e.args[3]),
        };
    });
}