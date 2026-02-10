
import 'source-map-support'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { formatDailyAuctionAggreg, getDbrAuctionContract, getGroupedByDayAuctionBuys } from '@app/util/dbr-auction';
import { NetworkIds } from '@app/types';
import { getSdolaContract } from '@app/util/dola-staking';
import { ascendingEventsSorter, estimateBlockTimestamp } from '@app/util/misc';
import { getHistoricDbrPriceOnCurve } from '@app/util/f2';
import { getSInvContract } from '@app/util/sINV';
import { SINV_ADDRESS, SINV_ADDRESS_V1, SINV_HELPER_ADDRESS, SINV_HELPER_ADDRESS_V1 } from '@app/config/constants';
import { Contract } from 'ethers';

const DBR_AUCTION_BUYS_CACHE_KEY_V2 = 'dbr-auction-buys-v2.0.1'

export default async function handler(req, res) {
    try {
        const cacheDuration = 300;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DBR_AUCTION_BUYS_CACHE_KEY_V2, true, cacheDuration);
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

        const archived = cachedData || {
            dailyBuys: [],
            last100: [],
            last100VirtualAuctionEvents: [],
            last100SdolaAuctionEvents: [],
            last100SinvAuctionEvents: [],
        };

        const lastKnownEvent = archived?.last100?.length > 0 ? (archived.last100[archived.last100.length - 1]) : {};
        const newStartingBlock = archived?.lastBlocknumber ? archived?.lastBlocknumber + 1 : (lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : undefined);

        const [generalAuctionBuys, sdolaAuctionBuys, sinvAuctionBuys, sinvAuctionBuysV1] = await Promise.all([
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
            )
        ]);

        const newBuyEvents = generalAuctionBuys
            .concat(sdolaAuctionBuys)
            .concat(sinvAuctionBuys)
            .concat(SINV_ADDRESS_V1 !== SINV_ADDRESS ? sinvAuctionBuysV1 : []);
        newBuyEvents.sort(ascendingEventsSorter);

        const blocks = newBuyEvents.map(e => e.blockNumber);
        const marketPriceBlocks = blocks.map(block => (block - 1));

        // take market price one block before
        const newMarketPrices = await Promise.all(
            marketPriceBlocks.map(block => {
                return getHistoricDbrPriceOnCurve(provider, block)
            })
        );

        const sinvAddressesLc = [SINV_ADDRESS_V1, SINV_ADDRESS].map(a => a.toLowerCase());
        const sinvHelperAddressesLc = [SINV_HELPER_ADDRESS_V1, SINV_HELPER_ADDRESS].map(a => a.toLowerCase());

        const newBuys = newBuyEvents.map(e => {
            const isSinvType = sinvAddressesLc.includes(e.address.toLowerCase()) || sinvHelperAddressesLc.includes(e.args[0].toLowerCase());
            const isSInvV2 = SINV_HELPER_ADDRESS !== SINV_HELPER_ADDRESS_V1 && e.address.toLowerCase() === sinvContract.address.toLowerCase() || e.args[0].toLowerCase() === SINV_HELPER_ADDRESS.toLowerCase();
            return {
                txHash: e.transactionHash,
                timestamp: estimateBlockTimestamp(e.blockNumber, currentTimestamp, currentBlocknumber),
                blockNumber: e.blockNumber,
                caller: e.args[0],
                to: e.args[1],
                invIn: isSinvType ? getBnToNumber(e.args[2]) : 0,
                dolaIn: isSinvType ? 0 : getBnToNumber(e.args[2]),
                dbrOut: getBnToNumber(e.args[3]),
                version: isSinvType ? isSInvV2 ? 'V2' : 'V1' : undefined,
                auctionType: e.address.toLowerCase() === sdolaContract.address.toLowerCase() ? 'sDOLA' : isSinvType ? 'sINV' : 'Virtual',
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

        const newTotalDailyBuys = getGroupedByDayAuctionBuys(newBuys.map(formatDailyAuctionAggreg), archived?.dailyBuys || []);

        const resultData = {
            timestamp: Date.now(),
            lastBlocknumber: currentBlocknumber,
            dbrSaleHandlerRepayPercentage: getBnToNumber(dbrSaleHandlerRepayBpsData, 2),
            last100: last100buys,
            last100VirtualAuctionEvents,
            last100SdolaAuctionEvents,
            last100SinvAuctionEvents,
            dailyBuys: newTotalDailyBuys,
        };

        await redisSetWithTimestamp(DBR_AUCTION_BUYS_CACHE_KEY_V2, resultData);

        resultData.dailyBuys.sort((a, b) => b.timestamp - a.timestamp);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(DBR_AUCTION_BUYS_CACHE_KEY_V2, false, 0);
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