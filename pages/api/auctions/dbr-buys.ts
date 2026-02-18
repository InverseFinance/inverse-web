
import 'source-map-support'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { formatDailyAuctionAggreg, getDbrAuctionContract, getGroupedByDayAuctionBuys, getInvBuyBackAuctionContract } from '@app/util/dbr-auction';
import { NetworkIds } from '@app/types';
import { getSdolaContract } from '@app/util/dola-staking';
import { ascendingEventsSorter, estimateBlockTimestamp } from '@app/util/misc';
import { getHistoricDbrPriceOnCurve } from '@app/util/f2';
import { getSInvContract } from '@app/util/sINV';
import { INV_BUY_BACK_AUCTION_HELPER, JDOLA_AUCTION_HELPER_ADDRESS, SINV_ADDRESS, SINV_ADDRESS_V1, SINV_HELPER_ADDRESS, SINV_HELPER_ADDRESS_V1 } from '@app/config/constants';
import { Contract } from 'ethers';
import { getJrdolaContract } from '@app/util/junior';
import { JsonRpcProvider } from '@ethersproject/providers';

const DBR_AUCTION_BUYS_CACHE_KEY_V4 = 'dbr-auction-buys-v4.0.0'

const getSdolaExRates = async (provider: JsonRpcProvider, blocks: number[]) => {
    const sdolaContract = getSdolaContract(provider);
    const ratesArray = await Promise.all(
        blocks.map(block => sdolaContract.convertToAssets('1000000000000000000', { blockTag: block }))
    );
    return ratesArray.reduce((acc, rate, index) => {
        acc[blocks[index]] = getBnToNumber(rate);
        return acc;
    }, {});
}

export default async function handler(req, res) {
    try {
        const cacheDuration = 300;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DBR_AUCTION_BUYS_CACHE_KEY_V4, true, cacheDuration);
        if (!!cachedData && isValid) {
            res.status(200).json(cachedData);
            return
        }

        const provider = getProvider(NetworkIds.mainnet);
        const paidProvider = getPaidProvider(1);

        const currentBlock = await provider.getBlock('latest');
        const currentBlocknumber = currentBlock.number;
        const currentTimestamp = currentBlock.timestamp * 1000;

        const dbrAuctionContract = getDbrAuctionContract(paidProvider);
        const sdolaContract = getSdolaContract(paidProvider);
        const sinvContract = getSInvContract(paidProvider);
        const sinvContractV1 = getSInvContract(paidProvider, SINV_ADDRESS_V1);
        const invBuyBackAuctionContract = getInvBuyBackAuctionContract(paidProvider);
        const jrDolaAuctionContract = getJrdolaContract(paidProvider);

        const archived = cachedData || {
            dailyBuys: [],
            last100: [],
            last100VirtualAuctionEvents: [],
            last100SdolaAuctionEvents: [],
            last100SinvAuctionEvents: [],
            last100InvBuyBackAuctionEvents: [],
            last100JrDolaAuctionEvents: [],
        };

        const lastKnownEvent = archived?.last100?.length > 0 ? (archived.last100[archived.last100.length - 1]) : {};
        const newStartingBlock = archived?.lastBlocknumber ? archived?.lastBlocknumber + 1 : (lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : undefined);

        const [
            generalAuctionBuys,
            sdolaAuctionBuys,
            sinvAuctionBuys,
            sinvAuctionBuysV1,
            invBuyBackAuctionBuys,
            jrDolaAuctionBuys,
        ] = await Promise.all([
            dbrAuctionContract.queryFilter(
                dbrAuctionContract.filters.Buy(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
            sdolaContract.queryFilter(
                sdolaContract.filters.Buy(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
            sinvContract.queryFilter(
                sinvContract.filters.Buy(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
            sinvContractV1.queryFilter(
                sinvContractV1.filters.Buy(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
            invBuyBackAuctionContract.queryFilter(
                invBuyBackAuctionContract.filters.Buy(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
            jrDolaAuctionContract.queryFilter(
                jrDolaAuctionContract.filters.Buy(),
                newStartingBlock ? newStartingBlock : 0x0,
            ),
        ]);

        const newBuyEvents = generalAuctionBuys
            .concat(sdolaAuctionBuys)
            .concat(sinvAuctionBuys)
            .concat(invBuyBackAuctionBuys)
            .concat(jrDolaAuctionBuys)
            .concat(SINV_ADDRESS_V1 !== SINV_ADDRESS ? sinvAuctionBuysV1 : []);
        newBuyEvents.sort(ascendingEventsSorter);

        const blocks = newBuyEvents.map(e => e.blockNumber);
        const jrDolaBlocks = jrDolaAuctionBuys.map(e => e.blockNumber);

        const marketPriceBlocks = blocks.map(block => (block - 1));

        // take market price one block before
        const newMarketPrices = await Promise.all(
            marketPriceBlocks.map(block => {
                return getHistoricDbrPriceOnCurve(provider, block)
            })
        );

        const sinvAddressesLc = [SINV_ADDRESS_V1, SINV_ADDRESS].map(a => a.toLowerCase());
        const sinvHelperAddressesLc = [SINV_HELPER_ADDRESS_V1, SINV_HELPER_ADDRESS].map(a => a.toLowerCase());

        const currentSdolaExRateBn = await sdolaContract.convertToAssets('1000000000000000000');
        const currentSdolaExRate = getBnToNumber(currentSdolaExRateBn);
        const sDolaExRates = await getSdolaExRates(paidProvider, jrDolaBlocks);

        const newBuys = newBuyEvents.map(e => {
            const isJrDolaType = e.address.toLowerCase() === jrDolaAuctionContract.address.toLowerCase() || e.args[0].toLowerCase() === JDOLA_AUCTION_HELPER_ADDRESS.toLowerCase();
            const isInvBuyBackType = e.address.toLowerCase() === invBuyBackAuctionContract.address.toLowerCase() || INV_BUY_BACK_AUCTION_HELPER.toLowerCase() === e.args[0].toLowerCase();
            const isSinvType = sinvAddressesLc.includes(e.address.toLowerCase()) || sinvHelperAddressesLc.includes(e.args[0].toLowerCase());
            const isSInvV2 = SINV_HELPER_ADDRESS !== SINV_HELPER_ADDRESS_V1 && e.address.toLowerCase() === sinvContract.address.toLowerCase() || e.args[0].toLowerCase() === SINV_HELPER_ADDRESS.toLowerCase();
            return {
                txHash: e.transactionHash,
                timestamp: estimateBlockTimestamp(e.blockNumber, currentTimestamp, currentBlocknumber),
                blockNumber: e.blockNumber,
                caller: e.args[0],
                to: e.args[1],
                invIn: isSinvType || isInvBuyBackType ? getBnToNumber(e.args[2]) : 0,
                dolaIn: isJrDolaType ? getBnToNumber(e.args[2]) * (sDolaExRates[e.blockNumber] || currentSdolaExRate) : isSinvType || isInvBuyBackType ? 0 : getBnToNumber(e.args[2]),
                sDolaIn: isJrDolaType ? getBnToNumber(e.args[2]) : 0,
                dbrOut: getBnToNumber(e.args[3]),
                version: isSinvType ? isSInvV2 ? 'V2' : 'V1' : undefined,
                auctionType: e.address.toLowerCase() === sdolaContract.address.toLowerCase() ? 'sDOLA' : isSinvType ? 'sINV' : isInvBuyBackType ? 'INV buyback' : isJrDolaType ? 'jrDOLA' : 'Virtual',
            };
        });

        newMarketPrices.forEach((m, i) => {
            newBuys[i].marketPriceInDola = m.priceInDola;
            newBuys[i].marketPriceInInv = m.priceInInv;
        });

        const dbrSaleHandler = new Contract('0x4f4A31C1c11Bdd438Cf0c7668D6aFa2b5825932e', ['function repayBps() public view returns (uint)'], provider);
        const dbrSaleHandlerRepayBpsData = await dbrSaleHandler.repayBps();

        const last100buys = archived.last100.concat(newBuys).slice(-100);
        const last100VirtualAuctionEvents = archived.last100VirtualAuctionEvents.concat(newBuys.filter(e => e.auctionType === 'Virtual')).slice(-100);
        const last100SdolaAuctionEvents = archived.last100SdolaAuctionEvents.concat(newBuys.filter(e => e.auctionType === 'sDOLA')).slice(-100);
        const last100SinvAuctionEvents = archived.last100SinvAuctionEvents.concat(newBuys.filter(e => e.auctionType === 'sINV')).slice(-100);
        const last100InvBuyBackAuctionEvents = (archived.last100InvBuyBackAuctionEvents || []).concat(newBuys.filter(e => e.auctionType === 'INV buyback')).slice(-100);
        const last100JrDolaAuctionEvents = (archived.last100JrDolaAuctionEvents || []).concat(newBuys.filter(e => e.auctionType === 'jrDOLA')).slice(-100);

        const newTotalDailyBuys = getGroupedByDayAuctionBuys(newBuys.map(formatDailyAuctionAggreg), archived?.dailyBuys || []);

        const resultData = {
            timestamp: Date.now(),
            lastBlocknumber: currentBlocknumber,
            totalInvBuyBacksAmount: (archived.totalInvBuyBacksAmount || 0) + newBuys.filter(e => e.auctionType === 'INV buyback').reduce((prev, curr) => prev + curr.amountIn, 0),
            totalInvBuyBacksWorth: (archived.totalInvBuyBacksWorth || 0) + newBuys.filter(e => e.auctionType === 'INV buyback').reduce((prev, curr) => prev + curr.dbrOut * curr.marketPriceInDola, 0),
            dbrSaleHandlerRepayPercentage: getBnToNumber(dbrSaleHandlerRepayBpsData, 2),
            last100: last100buys,
            last100VirtualAuctionEvents,
            last100SdolaAuctionEvents,
            last100SinvAuctionEvents,
            last100InvBuyBackAuctionEvents,
            last100JrDolaAuctionEvents,
            dailyBuys: newTotalDailyBuys,
        };

        await redisSetWithTimestamp(DBR_AUCTION_BUYS_CACHE_KEY_V4, resultData);

        resultData.dailyBuys.sort((a, b) => b.timestamp - a.timestamp);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(DBR_AUCTION_BUYS_CACHE_KEY_V4, false, 0);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).send(cache);
            } else {
                res.status(500).send({})
            }
        } catch (e) {
            console.error(e);
            res.status(500).send({})
        }
    }
}