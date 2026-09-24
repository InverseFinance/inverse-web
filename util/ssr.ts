import { SERVER_BASE_URL } from '@app/config/constants';
import { getCacheFromRedisAsObj, redisSetWithTimestamp } from '@app/util/redis';

/*
 * Server-side only (getServerSideProps): data loading for SSR pages that survives api failures.
 * Each valid api result is kept as a snapshot (in memory and in redis), when an api fails
 * (error, timeout or invalid data) the last snapshot is used instead and the result is flagged
 * so that the page can warn that some data might be outdated.
 */

// time given to an api before using the cached data
const SSR_API_TIMEOUT_MS = 8000;
// simulations are computed live and are not cached: allow more time
const SSR_SIMULATION_API_TIMEOUT_MS = 30000;
// min time given to redis to return the cached data, it also gets what the api did not use of its time
const SSR_SNAPSHOT_READ_MIN_TIMEOUT_MS = 2000;
// min interval between two redis saves of the same snapshot, per instance
const SSR_SNAPSHOT_SAVE_INTERVAL_MS = 60000;
// shorter cdn cache when a page uses cached data, so that it recovers quickly once the apis are back
export const SSR_FALLBACK_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=60';

export type SsrData<T = any> = {
    data: T | null,
    // true when the api failed: data is then the last cached data, or null if there is none
    isFallback: boolean,
};

type SsrSnapshot = { data: any, timestamp: number };

// last valid data of this instance, used when redis is unavailable too
const memorySnapshots: { [key: string]: SsrSnapshot } = {};
const lastRedisSaves: { [key: string]: number } = {};

const getSnapshotRedisKey = (key: string) => `ssr-snapshot-${key}`;

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
        promise.then(resolve, reject).finally(() => clearTimeout(timer));
    });
}

const saveSnapshot = (key: string, data: any) => {
    const now = Date.now();
    memorySnapshots[key] = { data, timestamp: now };
    if (now - (lastRedisSaves[key] || 0) < SSR_SNAPSHOT_SAVE_INTERVAL_MS) {
        return;
    }
    lastRedisSaves[key] = now;
    // not awaited: saving the snapshot should not delay the page
    redisSetWithTimestamp(getSnapshotRedisKey(key), data);
}

// most recent snapshot between redis (shared by all instances) and memory (this instance)
const getSnapshot = async (key: string, timeoutMs: number): Promise<SsrSnapshot | undefined> => {
    const memorySnapshot = memorySnapshots[key];
    try {
        const cache = await withTimeout(getCacheFromRedisAsObj(getSnapshotRedisKey(key), false), timeoutMs);
        const timestamp = ('timestamp' in cache && cache.timestamp) || 0;
        if (cache.data !== undefined && cache.data !== null && timestamp > (memorySnapshot?.timestamp || 0)) {
            return { data: cache.data, timestamp };
        }
    } catch (e) {
        console.warn(`[ssr] ${key}: could not read cached data from redis:`, e instanceof Error ? e.message : e);
    }
    return memorySnapshot;
}

/**
 * Loads data for getServerSideProps, never throws.
 * On error, timeout or invalid data, falls back to the last valid data saved under `key`.
 * @param key snapshot identifier, sources with the same key share their cached data, null disables the cache
 * @param getData loads the data, should stop when `signal` is aborted
 * @param isValid returns true when the data is usable
 */
export const getSsrData = async <T = any>(
    key: string | null,
    getData: (signal: AbortSignal) => Promise<T>,
    isValid: (data: T) => boolean,
    timeoutMs = SSR_API_TIMEOUT_MS,
): Promise<SsrData<T>> => {
    const start = Date.now();
    try {
        const data = await withTimeout(getData(AbortSignal.timeout(timeoutMs)), timeoutMs);
        if (!isValid(data)) {
            throw new Error('invalid data');
        }
        if (key) {
            saveSnapshot(key, data);
        }
        return { data, isFallback: false };
    } catch (e) {
        console.warn(`[ssr] ${key || 'uncached data'} failed, using cached data:`, e instanceof Error ? e.message : e);
        const snapshotTimeoutMs = Math.max(SSR_SNAPSHOT_READ_MIN_TIMEOUT_MS, start + timeoutMs - Date.now());
        const snapshot = key ? await getSnapshot(key, snapshotTimeoutMs) : undefined;
        return { data: snapshot?.data ?? null, isFallback: true };
    }
}

const fetchApi = async (path: string, signal: AbortSignal, isText = false) => {
    const res = await fetch(`${SERVER_BASE_URL}${path}`, { signal });
    if (!res.ok) {
        throw new Error(`${path} responded with status ${res.status}`);
    }
    return isText ? res.text() : res.json();
}

const isValidMarketsData = (data: any) => data?.markets?.length > 0;

export const getSsrFirmMarkets = (vnetPublicId = '') => {
    if (vnetPublicId) {
        return getSsrData(
            null,
            (signal) => fetchApi(`/api/f2/fixed-markets?v=1.2&vnetPublicId=${encodeURIComponent(vnetPublicId)}`, signal),
            isValidMarketsData,
            SSR_SIMULATION_API_TIMEOUT_MS,
        );
    }
    return getSsrData('f2-markets', (signal) => fetchApi('/api/f2/fixed-markets?v=1.2&cacheFirst=true', signal), isValidMarketsData);
}

export const getSsrFirmTvl = () => {
    return getSsrData('f2-tvl', (signal) => fetchApi('/api/f2/tvl?cacheFirst=true', signal), (data) => data?.firmTotalTvl > 0);
}

export const getSsrFirmMarketsDisplay = () => {
    return getSsrData('f2-markets-display', (signal) => fetchApi('/api/f2/markets-display', signal), (data) => data?.status === 'success' && !!data?.data);
}

export const getSsrDbr = () => {
    return getSsrData('dbr', (signal) => fetchApi('/api/dbr?cacheFirst=true', signal), (data) => data?.priceUsd > 0);
}

export const getSsrDolaPrice = () => {
    return getSsrData('dola-price', (signal) => fetchApi('/api/dola-price?cacheFirst=true', signal), (data) => data?.['dola-usd'] > 0);
}

export const getSsrDolaCirculatingSupply = () => {
    return getSsrData(
        'dola-circulating-supply',
        (signal) => fetchApi('/api/dola/circulating-supply?cacheFirst=true', signal, true).then(parseFloat),
        (supply) => supply > 0,
    );
}

export const getSsrDolaStaking = () => {
    return getSsrData('dola-staking', (signal) => fetchApi('/api/dola-staking?cacheFirst=true', signal), (data) => data?.tvlUsd > 0);
}
