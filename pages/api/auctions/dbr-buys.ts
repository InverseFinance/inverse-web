
import 'source-map-support'
import { getPaidProvider, getProvider } from '@app/util/providers';
import { getCacheFromRedis, getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { getDbrAuctionContract } from '@app/util/dbr-auction';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';
import { getSdolaContract } from '@app/util/dola-staking';
import { ascendingEventsSorter } from '@app/util/misc';
import { getHistoricDbrPriceOnCurve } from '@app/util/f2';
import { getSInvContract } from '@app/util/sINV';
import { SINV_ADDRESS, SINV_ADDRESS_V1, SINV_HELPER_ADDRESS, SINV_HELPER_ADDRESS_V1 } from '@app/config/constants';
import { Contract } from 'ethers';

const DBR_AUCTION_BUYS_CACHE_KEY = 'dbr-auction-buys-v1.1.0'

export default async function handler(req, res) {
    try {
        const cacheDuration = 60;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DBR_AUCTION_BUYS_CACHE_KEY, true, cacheDuration, true);
        if (!!cachedData && isValid) {
            res.status(200).send(cachedData);
            return
        }

        const provider = getProvider(NetworkIds.mainnet);
        const paidProvider = getPaidProvider(1);

        const dbrAuctionContract = getDbrAuctionContract(paidProvider);
        const sdolaContract = getSdolaContract(paidProvider);
        const sinvContract = getSInvContract(paidProvider);
        const sinvContractV1 = getSInvContract(paidProvider, SINV_ADDRESS_V1);

        const archived = cachedData || { buys: [] };
        const pastTotalEvents = archived?.buys || [];

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : {};
        const newStartingBlock = lastKnownEvent?.blockNumber ? lastKnownEvent?.blockNumber + 1 : undefined;

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

        const timestamps = await addBlockTimestamps(
            blocks,
            '1',
        );

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
                timestamp: timestamps[NetworkIds.mainnet][e.blockNumber] * 1000,
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

        const resultData = {
            timestamp: Date.now(),
            dbrSaleHandlerRepayPercentage: getBnToNumber(dbrSaleHandlerRepayBpsData, 2),
            buys: pastTotalEvents.concat(newBuys),
        };

        await redisSetWithTimestamp(DBR_AUCTION_BUYS_CACHE_KEY, resultData, true);

        resultData.buys.sort((a, b) => b.timestamp - a.timestamp);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(DBR_AUCTION_BUYS_CACHE_KEY, false, 0, true);
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