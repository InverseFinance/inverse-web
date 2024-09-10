import { DBR_AUCTION_ABI, DBR_AUCTION_HELPER_ABI, SINV_ABI } from "@app/config/abis";
import { useContractEvents } from "@app/hooks/useContractEvents";
import { JsonRpcSigner } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { ascendingEventsSorter } from "./misc";
import { useBlocksTimestamps } from "@app/hooks/useBlockTimestamp";
import { getBnToNumber, getNumberToBn } from "./markets";
import { useCustomSWR } from "@app/hooks/useCustomSWR";
import { SWR } from "@app/types";
import { fetcher } from "./web3";
import { DBR_AUCTION_ADDRESS, DBR_AUCTION_HELPER_ADDRESS, SDOLA_ADDRESS, SINV_ADDRESS } from "@app/config/constants";
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
    events: any[],
    dolaEvents: any[],
    invEvents: any[],
    virtualAuctionEvents: any[],
    sdolaAuctionEvents: any[],
    sinvAuctionEvents: any[],
    accountEvents: any,    
    timestamp: number,
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
    accWorthIn: number,
} => {
    const liveEvents = []//useDbrAuctionBuyEvents(from);
    const { data, error } = useCustomSWR(`/api/auctions/dbr-buys?v=1.0.1`, fetcher);

    const events = (liveEvents?.length > data?.buys?.length ? liveEvents : data?.buys || [])
        .map((e,i) => {
            const isInvCase = e.auctionType === 'sINV';
            const priceInDola = (e.dolaIn||0 / e.dbrOut);
            const priceInInv = (e.invIn||0 / e.dbrOut);
            const amountIn = isInvCase ? e.invIn : e.dolaIn;
            const arb = isInvCase ? e.marketPriceInInv - priceInInv : e.marketPriceInDola - priceInDola;
            const worthIn = e.dolaIn ? e.dolaIn : e.invIn * e.marketPriceInInv;
            const priceAvg = isInvCase ? (priceInInv + e.marketPriceInInv) / 2 : (priceInDola + e.marketPriceInDola) / 2;
            return ({ ...e, key: `${e.txHash}-${i}`, priceInDola, priceInInv, amountIn, worthIn, arb, arbPerc: arb/(priceAvg)*100 })
        });

    const dolaEvents = events.filter(e => e.auctionType === 'Virtual' || e.auctionType === 'sDOLA');
    const invEvents = events.filter(e => e.auctionType === 'sINV');
    const accDolaIn = dolaEvents.reduce((prev, curr) => prev + curr.dolaIn||0, 0);
    const accWorthIn = dolaEvents.reduce((prev, curr) => prev + curr.worthIn||0, 0);
    const accDbrOutFromDola = dolaEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);
    const accDbrOut = events.reduce((prev, curr) => prev + curr.dbrOut, 0);

    const virtualAuctionEvents = events.filter(e => e.auctionType === 'Virtual');
    const sdolaAuctionEvents = events.filter(e => e.auctionType === 'sDOLA');
    const sinvAuctionEvents = events.filter(e => e.auctionType === 'sINV');

    const accDolaInVirtual = virtualAuctionEvents.reduce((prev, curr) => prev + curr.dolaIn||0, 0);
    const accDbrOutVirtual = virtualAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);

    const accDolaInSdola = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.dolaIn||0, 0);
    const accDbrOutSdola = sdolaAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);

    const accInvInSinv = sinvAuctionEvents.reduce((prev, curr) => prev + curr.invIn||0, 0);
    const accDbrOutSinv = sinvAuctionEvents.reduce((prev, curr) => prev + curr.dbrOut, 0);
    const accInvIn = accInvInSinv;

    const avgDbrPrice = accDolaIn / accDbrOutFromDola;
    const nbBuys = events.length;

    return {
        events,
        dolaEvents,
        invEvents,
        virtualAuctionEvents,
        sdolaAuctionEvents,
        sinvAuctionEvents,
        accountEvents: events.filter(e => e.to === from),
        nbBuys,
        avgDbrPrice,
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
        accWorthIn,
        timestamp: !from ? data?.timestamp : 0,
        isLoading: !error && !data,
        isError: error,
    }
}

export const useDbrAuctionBuyEvents = (account: string) => {
    const { events: generalAuctionBuys } = useContractEvents(
        DBR_AUCTION_ADDRESS,
        DBR_AUCTION_ABI,
        'Buy',
        !!account ? [undefined, account] : undefined,
    );
    const { events: sdolaAuctionBuys } = useContractEvents(
        SDOLA_ADDRESS,
        DBR_AUCTION_ABI,
        'Buy',
        !!account ? [undefined, account] : undefined,
    );
    const { events: sinvAuctionBuys } = useContractEvents(
        SINV_ADDRESS,
        SINV_ABI,
        'Buy',
        !!account ? [undefined, account] : undefined,
    );
    const buyEvents = generalAuctionBuys.concat(sdolaAuctionBuys).concat(sinvAuctionBuys);
    buyEvents.sort(ascendingEventsSorter);    
    const uniqueBlocks = [...new Set(buyEvents.map(e => e.blockNumber))];
    const { timestamps } = useBlocksTimestamps(uniqueBlocks);
    const timestampsAsObj = timestamps.reduce((prev, curr, i) => ({ ...prev, [uniqueBlocks[i]]: curr / 1000 }), {});
    return formatDbrAuctionBuys(buyEvents, timestampsAsObj);
}

export const formatDbrAuctionBuys = (events: any[], timestamps?: any) => {
    let totalBuys = 0;
    return events.map(e => {
        const amount = getBnToNumber(e.args.amount || e.args.assets || e.args.dolaIn || e.args.invIn || '0');
        totalBuys += amount;
        const isSinv = e.address === SINV_ADDRESS;
        return {
            txHash: e.transactionHash,
            timestamp: timestamps ? timestamps[e.blockNumber] * 1000 : undefined,
            blockNumber: e.blockNumber,
            caller: e.args[0],
            to: e.args[1],
            invIn: isSinv ? getBnToNumber(e.args[2]) : 0,
            dolaIn: isSinv ? 0 : getBnToNumber(e.args[2]),
            dbrOut: getBnToNumber(e.args[3]),
            auctionType: e.address === SDOLA_ADDRESS ? 'sDOLA' : isSinv ? 'sINV' : 'Virtual',
        };
    });
}

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
    auctionType: 'classic' | 'sdola' | 'sinv',
}) => {
    const [estimatedTimeToReachMarketPrice, setEstimatedTimeToReachMarketPrice] = useState(0);
    const isClassicDbrAuction = auctionType === 'classic';
    const defaultRefAmount = isClassicDbrAuction ? defaultRefClassicAmount : defaultRefSdolaAmount;
    const { tokenReserve, dbrReserve, dbrRatePerYear } = useDbrAuction(auctionType);
    const isSinvAuction = auctionType === 'sinv';

    const { data, error } = useEtherSWR([
        [helperAddress, 'getDbrOut', parseEther(tokenAmount || defaultRefAmount)],
        [helperAddress, 'getDbrOut', parseEther(defaultRefAmount)],
        [helperAddress, isSinvAuction ? 'getInvIn' : 'getDolaIn', parseEther(dbrAmount || defaultRefAmount)],
        [helperAddress, isSinvAuction ? 'getInvIn' : 'getDolaIn', parseEther(defaultRefAmount)],
    ]);

    const isLoading = (!data && !error);
    const refDbrOut = data && data[1] ? getBnToNumber(data[1]) : 0;
    const estimatedDbrOut = data && data[0] && !!tokenAmount ? getBnToNumber(data[0]) : 0;
    const minDbrOut = data && data[0] ? getNumberToBn(estimatedDbrOut * (1 - parseFloat(slippage) / 100)) : BigNumber.from('0');

    const refTokenIn = data && data[3] ? getBnToNumber(data[3]) : 0;
    const refAuctionPriceInToken = data ? parseFloat(defaultRefAmount) / refDbrOut : 0;

    const estimatedTokenIn = data && data[2] && !!dbrAmount ? getBnToNumber(data[2]) : 0;
    const maxTokenIn = data && data[2] ? getNumberToBn(estimatedTokenIn * (1 + parseFloat(slippage) / 100)) : BigNumber.from('0');

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