
import { BLOCK_TIMESTAMPS } from '@app/config/blocknumber-timestamps-archived';
import { getRedisClient } from '@app/util/redis';
import { mergeDeep } from './misc';
import { getProvider } from './providers';

const client = getRedisClient();

export const addBlockTimestamps = async (blockNumbers: number[], chainId: string) => {
    const blockTimestamps = await getCachedBlockTimestamps();
    const cachedBns = Object.keys(blockTimestamps[chainId]);

    const uniqueBns = [...new Set(blockNumbers)].filter(v => !cachedBns.includes(v.toString()));

    const provider = getProvider(chainId);
    const results = await Promise.all(
        uniqueBns.map(blockNumber => provider.getBlock(blockNumber))
    );
    results.forEach(r => {
        // in secs
        blockTimestamps[chainId][r.number] = r.timestamp;
    });
    await client.set('block-timestamps', JSON.stringify(blockTimestamps));
}

export const getCachedBlockTimestamps = async () => {
    const cachedBlockTimestamps: { [key: string]: { [key: string]: number } } = JSON.parse((await client.get('block-timestamps')) || '{}');
    return mergeDeep(BLOCK_TIMESTAMPS, cachedBlockTimestamps);
}