
import { BLOCK_TIMESTAMPS } from '@app/config/blocknumber-timestamps-archived';
import { getRedisClient } from '@app/util/redis';
import { mergeDeep } from './misc';
import { getProvider } from './providers';

const client = getRedisClient();
// add to unarchived cached
export const addBlockTimestamps = async (blockNumbers: number[], chainId: string) => {
    const cachedOnlyBlockTimestamps = await getRedisCachedOnlyBlockTimestamps();
    const cachedAndArchivedBlockTimestamps = mergeDeep(BLOCK_TIMESTAMPS, cachedOnlyBlockTimestamps);
    if(!cachedAndArchivedBlockTimestamps[chainId]) {
        cachedAndArchivedBlockTimestamps[chainId] = {};
    }
    const cachedBns = Object.keys(cachedAndArchivedBlockTimestamps[chainId]);

    const uniqueBns = [...new Set(blockNumbers)].filter(v => !cachedBns.includes(v.toString()));
    const provider = getProvider(chainId);
    const results = await Promise.all(
        uniqueBns.map(blockNumber => provider.getBlock(blockNumber))
    );
    if(!cachedOnlyBlockTimestamps[chainId]) cachedOnlyBlockTimestamps[chainId] = {};
    results.forEach(r => {
        // in secs
        cachedOnlyBlockTimestamps[chainId][r.number] = r.timestamp;
    });    
    await client.set('block-timestamps-unarchived', JSON.stringify(cachedOnlyBlockTimestamps));
}
// archived + cached but unarchived
export const getCachedBlockTimestamps = async () => {
    const cachedBlockTimestamps: { [key: string]: { [key: string]: number } } = JSON.parse(await client.get('block-timestamps-unarchived') || '{}');
    return mergeDeep(BLOCK_TIMESTAMPS, cachedBlockTimestamps);
}
// cached but unarchived
export const getRedisCachedOnlyBlockTimestamps = async () => {
    return JSON.parse(await client.get('block-timestamps-unarchived') || '{}');
}