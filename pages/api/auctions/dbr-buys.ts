
import 'source-map-support'
import { getProvider } from '@app/util/providers';
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

const DBR_AUCTION_BUYS_CACHE_KEY = 'dbr-auction-buys-v1.0.1'

export default async function handler(req, res) {
    try {
        const cacheDuration = 60;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const { data: cachedData, isValid } = await getCacheFromRedisAsObj(DBR_AUCTION_BUYS_CACHE_KEY, true, cacheDuration);
        if (!!cachedData && isValid) {
            res.status(200).send(cachedData);
            return
        }

        const provider = getProvider(NetworkIds.mainnet);
        const dbrAuctionContract = getDbrAuctionContract(provider);
        const sdolaContract = getSdolaContract(provider);
        const sinvContract = getSInvContract(provider);
        const sinvContractV1 = getSInvContract(provider, SINV_ADDRESS_V1);

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
            const isSInvV2 = e.address.toLowerCase() === sinvContract.address.toLowerCase() || e.args[0].toLowerCase() === SINV_HELPER_ADDRESS.toLowerCase();
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

        const resultData = {
            timestamp: Date.now(),
            buys: pastTotalEvents.concat(newBuys),
        };

        await redisSetWithTimestamp(DBR_AUCTION_BUYS_CACHE_KEY, resultData);

        resultData.buys.sort((a, b) => b.timestamp - a.timestamp);

        res.status(200).send(resultData);
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(DBR_AUCTION_BUYS_CACHE_KEY, false);
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