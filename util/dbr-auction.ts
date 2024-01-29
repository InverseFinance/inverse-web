import { DBR_AUCTION_ABI, DBR_AUCTION_HELPER_ABI } from "@app/config/abis";
import { useContractEvents } from "@app/hooks/useContractEvents";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { ascendingEventsSorter } from "./misc";
import { useBlocksTimestamps } from "@app/hooks/useBlockTimestamp";
import { getBnToNumber, getNumberToBn } from "./markets";
import { useCustomSWR } from "@app/hooks/useCustomSWR";
import { SWR } from "@app/types";
import { fetcher } from "./web3";
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS } from "@app/config/constants";
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

    const events = (liveEvents?.length > data?.buys?.length ? liveEvents : data?.buys || [])
        .map(e => ({ ...e, priceInDola: (e.dolaIn / e.dbrOut) }));
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

export const formatDbrAuctionBuys = (events: any[], timestamps?: any) => {
    let totalBuys = 0;
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

const defaultRefClassicAmount = '1';
const defaultRefSdolaAmount = '0.999';

export const useDbrAuctionPricing = ({    
    dolaAmount,
    dbrAmount,
    helperAddress,
    slippage,
    isExactDola,
    dbrSwapPriceRefInDola,
}: {
    dolaAmount: string,
    dbrAmount: string,
    helperAddress: string,
    slippage: string,
    isExactDola: boolean,
    dbrSwapPriceRefInDola: number,
}) => {
    const [estimatedTimeToReachMarketPrice, setEstimatedTimeToReachMarketPrice] = useState(0);
    const isClassicDbrAuction = helperAddress?.toString() === DBR_AUCTION_HELPER_ADDRESS.toString();
    const defaultRefAmount = isClassicDbrAuction ? defaultRefClassicAmount : defaultRefSdolaAmount;
    const { dolaReserve, dbrReserve, dbrRatePerYear } = useDbrAuction(isClassicDbrAuction);

    const { data, error } = useEtherSWR([
        [helperAddress, 'getDbrOut', parseEther(dolaAmount || defaultRefAmount)],
        [helperAddress, 'getDbrOut', parseEther(defaultRefAmount)],
        [helperAddress, 'getDolaIn', parseEther(dbrAmount || defaultRefAmount)],
        [helperAddress, 'getDolaIn', parseEther(defaultRefAmount)],
    ]);

    const isLoading = (!data && !error);
    const refDbrOut = data && data[1] ? getBnToNumber(data[1]) : 0;
    const estimatedDbrOut = data && data[0] && !!dolaAmount ? getBnToNumber(data[0]) : 0;
    const minDbrOut = data && data[0] ? getNumberToBn(estimatedDbrOut * (1 - parseFloat(slippage) / 100)) : BigNumber.from('0');

    const refDolaIn = data && data[3] ? getBnToNumber(data[3]) : 0;
    const refAuctionPriceInDola = data ? parseFloat(defaultRefAmount) / refDbrOut : 0;

    const estimatedDolaIn = data && data[2] && !!dbrAmount ? getBnToNumber(data[2]) : 0;
    const maxDolaIn = data && data[2] ? getNumberToBn(estimatedDolaIn * (1 + parseFloat(slippage) / 100)) : BigNumber.from('0');

    const minDbrOutNum = getBnToNumber(minDbrOut);
    const maxDolaInNum = getBnToNumber(maxDolaIn);

    const dbrAuctionPrice = isExactDola ?
        (estimatedDbrOut > 0 ? estimatedDbrOut / parseFloat(dolaAmount) : refDbrOut / parseFloat(defaultRefAmount))
        :
        (estimatedDolaIn > 0 ? parseFloat(dbrAmount) / estimatedDolaIn : refDolaIn > 0 ? parseFloat(defaultRefAmount) / refDolaIn : 0);

    const dbrAuctionPriceInDola = dbrAuctionPrice ? 1 / dbrAuctionPrice : 0;
    const estimatedTimestampToReachMarketPrice = (estimatedTimeToReachMarketPrice * 1000) + Date.now();

    useEffect(() => {
        if (!dbrSwapPriceRefInDola || !dolaReserve || !dbrRatePerYear || !dbrReserve) return;
        if (dbrSwapPriceRefInDola > refAuctionPriceInDola) {
            setEstimatedTimeToReachMarketPrice(0);
            return;
        }
        setEstimatedTimeToReachMarketPrice(
            estimateAuctionTimeToReachMarketPrice(dolaReserve, dbrReserve, dbrRatePerYear, dbrSwapPriceRefInDola)
        );
    }, [dbrSwapPriceRefInDola, refAuctionPriceInDola, dolaReserve, dbrReserve, dbrRatePerYear]);

    return {
        isLoading,
        estimatedTimestampToReachMarketPrice,
        estimatedTimeToReachMarketPrice,
        dbrSwapPriceRefInDola,        
        dbrAuctionPriceInDola,
        minDbrOutNum,
        maxDolaInNum,
        minDbrOut,
        maxDolaIn,
        helperAddress,
        isClassicDbrAuction,
        estimatedDolaIn,
        estimatedDbrOut,
    }
}