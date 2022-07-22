import { Contract } from 'ethers'
import 'source-map-support'
import { BONDS_ABIS } from '@app/config/abis'

import { getProvider } from '@app/util/providers';
import { getCacheFromRedis, redisSetWithTimestamp } from '@app/util/redis'
import { NetworkIds } from '@app/types';
import { getBnToNumber } from '@app/util/markets'
import { BONDS } from '@app/variables/tokens';
import { addBlockTimestamps, getCachedBlockTimestamps } from '@app/util/timestamps';
import { BLOCKS_PER_DAY } from '@app/config/constants';

export default async function handler(req, res) {

    const cacheKey = `bonds-cache-v1.0.0`;

    try {

        const validCache = await getCacheFromRedis(cacheKey, true, 300);
        if (validCache) {
          res.status(200).json(validCache);
          return
        }

        const provider = getProvider(NetworkIds.mainnet);

        const deposits = await Promise.all(
            BONDS.map(b => {
                const contract = new Contract(b.bondContract, BONDS_ABIS[b.abiType], provider)
                return contract.queryFilter(contract.filters.BondCreated())
            })
        )

        const blocks = deposits.map(d => d.map(e => e.blockNumber)).flat();
        await addBlockTimestamps(
            blocks,
            NetworkIds.mainnet,
        );
        const timestamps = await getCachedBlockTimestamps();

        const formattedDeposits = deposits.map((d, i) => {
            const bond = BONDS[i];
            return d.map(e => {
                const expires = getBnToNumber(e.args[2], 0);
                const duration = Math.round((expires - e.blockNumber) / BLOCKS_PER_DAY);
                return {
                    timestamp: timestamps[NetworkIds.mainnet][e.blockNumber],
                    input: bond.underlying.symbol,
                    duration,
                    type: `${bond.underlying.symbol}-${duration}`,
                    inputAmount: getBnToNumber(e.args[0]),
                    outputAmount: getBnToNumber(e.args[1]),
                    txHash: e.transactionHash,
                }
            })
        })

        const resultData = {
            deposits: formattedDeposits,
        }

        await redisSetWithTimestamp(cacheKey, resultData);

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