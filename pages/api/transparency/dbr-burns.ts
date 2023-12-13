import { Contract } from 'ethers'
import 'source-map-support'
import { DBR_ABI } from '@app/config/abis'
import { getNetworkConfigConstants } from '@app/util/networks'
import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { getBnToNumber } from '@app/util/markets'
import { BURN_ADDRESS, CHAIN_ID } from '@app/config/constants';
import { addBlockTimestamps } from '@app/util/timestamps';
import { NetworkIds } from '@app/types';

const { DBR } = getNetworkConfigConstants();

export default async function handler(req, res) {
    const cacheKey = `dbr-burns-v1.0.0`;
    const { cacheFirst } = req.query;

    try {
        const cacheDuration = 1800;
        res.setHeader('Cache-Control', `public, max-age=${cacheDuration}`);
        const validCache = await getCacheFromRedis(cacheKey, cacheFirst !== 'true', cacheDuration, true);
        if (validCache) {
            res.status(200).json(validCache);
            return
        }

        const provider = getProvider(CHAIN_ID);
        const contract = new Contract(DBR, DBR_ABI, provider);

        const archived = await getCacheFromRedis(cacheKey, false, 0, true);
        const pastTotalEvents = archived?.totalBurns || [];

        const lastKnownEvent = pastTotalEvents?.length > 0 ? (pastTotalEvents[pastTotalEvents.length - 1]) : {};
        const newStartingBlock = lastKnownEvent ? lastKnownEvent?.blockNumber + 1 : 0;

        const newBurnEvents = await contract.queryFilter(
            contract.filters.Transfer(undefined, BURN_ADDRESS),
            newStartingBlock ? newStartingBlock : 0x0,
        );

        const blocks = newBurnEvents.map(e => e.blockNumber);

        const timestamps = await addBlockTimestamps(
            blocks,
            NetworkIds.mainnet,
        );        

        const newBurns = newBurnEvents.map(e => {
            return {
                timestamp: timestamps[NetworkIds.mainnet][e.blockNumber] * 1000,
                blockNumber: e.blockNumber,
                amount: getBnToNumber(e.args[2]),
            };
        }).filter(e => e.amount > 0);

        let accBurn = 0;

        const resultData = {
            timestamp: +(new Date()),
            totalBurns: pastTotalEvents.concat(newBurns).map(e => {
                return { ...e, accBurn: accBurn += e.amount}
            }),
        };

        await redisSetWithTimestamp(cacheKey, resultData, true);

        res.status(200).json(resultData)
    } catch (err) {
        console.error(err);
        // if an error occured, try to return last cached results
        try {
            const cache = await getCacheFromRedis(cacheKey, false);
            if (cache) {
                console.log('Api call failed, returning last cache found');
                res.status(200).json(cache);
            }
        } catch (e) {
            console.error(e);
        }
    }
}