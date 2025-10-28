import { ONE_DAY_MS } from '@app/config/constants';
import { WrappedNodeRedisClient, createNodeRedisClient } from 'handy-redis';

let redisClient: WrappedNodeRedisClient = initRedis();
let redisNewDBClient: WrappedNodeRedisClient = initNewRedisDB();

const CACHE_VERSION = 1;

function initRedis() {
    console.log('Redis: connecting');
    const client = createNodeRedisClient({
        url: process.env.REDIS_URL,
        retry_strategy: function (options) {
            console.log('retry strategy triggered');
            if (options.error && options.error.code === "ECONNREFUSED") {
                return new Error("The server refused the connection");
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                return new Error("Retry time exhausted");
            }
            if (options.attempt > 10) {
                // End reconnecting with built in error
                return undefined;
            }
            // reconnect after
            return Math.min(options.attempt * 100, 3000);
        },
    });

    client.nodeRedis.on('error', (err) => {
        console.log('Redis Client Error', err);
        // try reconnection after 10 sec
        setTimeout(() => {
            redisClient = initRedis();
        }, 10000);
    });

    return client;
}

function initNewRedisDB() {
    console.log('Redis new DB: connecting');
    const client = createNodeRedisClient({
        url: process.env.REDIS_NEW_URL,
        retry_strategy: function (options) {
            console.log('retry strategy triggered');
            if (options.error && options.error.code === "ECONNREFUSED") {
                return new Error("The server refused the connection");
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
                return new Error("Retry time exhausted");
            }
            if (options.attempt > 10) {
                // End reconnecting with built in error
                return undefined;
            }
            // reconnect after
            return Math.min(options.attempt * 100, 3000);
        },
    });

    client.nodeRedis.on('error', (err) => {
        console.log('Redis Client Error', err);
        // try reconnection after 10 sec
        setTimeout(() => {
            redisNewDBClient = initNewRedisDB();
        }, 10000);
    });

    return client;
}

export const getRedisClient = (): WrappedNodeRedisClient => {
    return redisClient;
}

async function getKeysForPattern(pattern: string) {
    let cursor = '0';
    const keys = [];

    do {
        const [nextCursor, foundKeys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys.push(...foundKeys);
    } while (cursor !== '0');

    return keys;
}

export const migratePureKeys = async () => {
    const pureKeys = [
        'drafts',
        '1-delegates',
        'lastDraftId',
        'custom-txs-to-refund-v2',
        'refunds-ignore-tx-hashes',
        'block-timestamps-unarchived-5',
        'xchain-block-timestamps-unarchived',
    ];
    for (const key of pureKeys) {
        const value = await redisClient.get(key);
        if (value) {
            await redisNewDBClient.set(key, value);
        }
    }
}

export const migratePattern = async (pattern: string) => {
    // let pattern = 'proposal-reviews-*';
    let keys = await getKeysForPattern(pattern);
    for (const key of keys) {
        const newDbValue = await redisNewDBClient.get(key);
        if (!newDbValue) {
            const value = await redisClient.get(key);
            if (value) {
                await redisNewDBClient.set(key, value);
            }
        }
    }

    // pattern = 'poa-sign-*';
    // keys = await getKeysForPattern(pattern);
    // for(const key of keys) {
    //     const value = await redisClient.get(key);
    //     if(value) {
    //         await redisNewDBClient.set(key, value);
    //     }
    // }
}

export const migrateOtherKeys = async () => {
    const nonPureKeysNoChunks = [
        'utc-dates-blocks',
    ];
    for (const key of nonPureKeysNoChunks) {
        await getCacheFromRedis(key, false);
    }

    const nonPureKeysWithChunks = [
        'eligible-refunds-txs',
        'refunded-txs-epoch-x',
    ];
    for (const key of nonPureKeysWithChunks) {
        const value = await getCacheFromRedis(key, false, 1, true);
    }
}

export const getNewRedisDBClient = (): WrappedNodeRedisClient => {
    return redisNewDBClient;
}

export const getCacheFromRedis = async (
    cacheKey: string,
    checkForTime = true,
    cacheTime = 1800,
    useChunks = false,
) => {
    try {
        const { data, isValid } = await getCacheFromRedisAsObj(cacheKey, checkForTime, cacheTime, useChunks);

        if (isValid && data) { return data }
    } catch (e) {
        console.log(cacheKey);
        console.log(e);
    }
    return undefined;
}

export const getCacheFromRedisAsObj = async (
    cacheKey: string,
    checkForTime = true,
    cacheTime = 1800,
    useChunks = false,
) => {
    try {
        let cache, cacheObj;
        let saveToNewDB = false;
        if (!useChunks) {
            const [oldDbCache, newDbCache] = await Promise.all([
                redisClient.get(`${cacheKey}-version-${CACHE_VERSION}`),
                redisNewDBClient.get(`${cacheKey}-version-${CACHE_VERSION}`),
            ]);
            cache = newDbCache || oldDbCache;
            if (cache) {
                cacheObj = JSON.parse(cache);
            }
            if (!newDbCache) {
                saveToNewDB = true
            }
        } else {
            const [oldMeta, newMeta] = await Promise.all([
                redisClient.get(`${cacheKey}-version-${CACHE_VERSION}-chunks-meta`),
                redisNewDBClient.get(`${cacheKey}-version-${CACHE_VERSION}-chunks-meta`),
            ]);
            const meta = newMeta || oldMeta;
            const currClient = !!newMeta ? redisNewDBClient : redisClient;
            if (meta) {
                const metaObj = JSON.parse(meta);
                const arr = [...Array(metaObj.nbChunks).keys()];
                const chunks = await Promise.all(
                    arr.map((v, i) => {
                        return currClient.get(`${cacheKey}-version-${CACHE_VERSION}-chunk-${i}`)
                    })
                )
                cache = chunks.join('');
                cacheObj = { ...metaObj, ...JSON.parse(cache) }
            }
            if (!newMeta) {
                saveToNewDB = true
            }
        }
        if (cache) {
            if (saveToNewDB) {
                await redisSetWithTimestamp(cacheKey, cacheObj.data, useChunks);
            }
            const now = Date.now();
            return {
                data: cacheObj.data,
                timestamp: cacheObj?.timestamp,
                isValid: !checkForTime || ((now - cacheObj?.timestamp) / 1000 < cacheTime),
            };
        }
    } catch (e) {
        console.log(cacheKey);
        console.log(e);
    }
    return { data: undefined, isValid: false };
}

export const invalidateRedisCache = async (key: string, useChunks = false) => {
    const invalidatedTs = Date.now() - ONE_DAY_MS * 365;
    if (useChunks) {
        const meta = await redisClient.get(`${key}-version-${CACHE_VERSION}-chunks-meta`);
        if (meta) {
            await redisNewDBClient.set(`${key}-version-${CACHE_VERSION}-chunks-meta`, JSON.stringify({ ...JSON.parse(meta), timestamp: invalidatedTs }));
        }
    } else {
        const current = await redisClient.get(`${key}-version-${CACHE_VERSION}`);
        if (current) {
            await redisNewDBClient.set(`${key}-version-${CACHE_VERSION}`, JSON.stringify({ ...JSON.parse(current), timestamp: invalidatedTs }));
        }
    }
}

export const redisSetWithTimestamp = async (key: string, data: any, useChunks = false) => {
    try {
        if (!useChunks) {
            const dataString = JSON.stringify({ timestamp: Date.now(), data });
            return await redisNewDBClient.set(`${key}-version-${CACHE_VERSION}`, dataString);
        }
        const dataString = JSON.stringify({ data });
        // 200k chars
        const nbChunks = Math.ceil(dataString.length / 200000);
        const dataStringMeta = JSON.stringify({ timestamp: Date.now(), nbChunks });
        const stringChunks = dataString.match(/.{1,200000}/g) ?? [];
        return await Promise.all([
            redisNewDBClient.set(`${key}-version-${CACHE_VERSION}-chunks-meta`, dataStringMeta),
            ...stringChunks.map((chunk, i) => redisNewDBClient.set(`${key}-version-${CACHE_VERSION}-chunk-${i}`, chunk))
        ]);
    } catch (e) {
        console.log(e);
        return
    }
}

export const isInvalidGenericParam = (value: string) => {
    return !!value && !/^[0-9a-zA-Z-]+$/.test(value);
}