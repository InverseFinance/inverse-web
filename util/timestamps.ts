
import { BLOCK_TIMESTAMPS } from '@app/config/blocknumber-timestamps-archived';
import { getRedisClient } from '@app/util/redis';
import { mergeDeep } from './misc';
import { getHistoricalProvider } from './providers';

const client = getRedisClient();
const cachedButNotArchivedYetKey = 'block-timestamps-unarchived-4';
// add to unarchived cached
export const addBlockTimestamps = async (blockNumbers: number[], chainId: string, cacheKey = cachedButNotArchivedYetKey) => {
    const cachedOnlyBlockTimestamps = await getRedisCachedOnlyBlockTimestamps(cacheKey);
    const cachedAndArchivedBlockTimestamps = mergeDeep(BLOCK_TIMESTAMPS, cachedOnlyBlockTimestamps);
    if(!cachedAndArchivedBlockTimestamps[chainId]) {
        cachedAndArchivedBlockTimestamps[chainId] = {};
    }
    const cachedBns = Object.keys(cachedAndArchivedBlockTimestamps[chainId]);

    const uniqueBns = [...new Set(blockNumbers)].filter(v => !cachedBns.includes(v.toString()));
    const provider = getHistoricalProvider(chainId);
    const results = await Promise.all(
        uniqueBns.map(blockNumber => provider.getBlock(blockNumber))
    );
    if(!cachedOnlyBlockTimestamps[chainId]) cachedOnlyBlockTimestamps[chainId] = {};
    results.forEach(r => {
        // in secs
        cachedOnlyBlockTimestamps[chainId][r.number] = r.timestamp;
    });    
    await client.set(cacheKey, JSON.stringify(cachedOnlyBlockTimestamps));
    return mergeDeep(BLOCK_TIMESTAMPS, cachedOnlyBlockTimestamps);
}
// archived + cached but unarchived
export const getCachedBlockTimestamps = async (cacheKey = cachedButNotArchivedYetKey) => {
    const cachedBlockTimestamps: { [key: string]: { [key: string]: number } } = JSON.parse(await client.get(cacheKey) || '{}');
    return mergeDeep(BLOCK_TIMESTAMPS, cachedBlockTimestamps);
}
// cached but unarchived
export const getRedisCachedOnlyBlockTimestamps = async (cacheKey = cachedButNotArchivedYetKey) => {
    return JSON.parse(await client.get(cacheKey) || '{}');
}