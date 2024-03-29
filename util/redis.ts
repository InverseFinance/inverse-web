import { WrappedNodeRedisClient, createNodeRedisClient } from 'handy-redis';

let redisClient: WrappedNodeRedisClient = initRedis();

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

export const getRedisClient = (): WrappedNodeRedisClient => {
    return redisClient;
}

export const getCacheFromRedis = async (
    cacheKey: string,
    checkForTime = true,
    cacheTime = 1800,
    useChunks = false,
) => {
    try {
        const { data, isValid } = await getCacheFromRedisAsObj(cacheKey, checkForTime, cacheTime, useChunks);

        if(isValid && data) { return data }
    } catch (e) {
        console.log(String(cacheKey).replace(/\n|\r/g, ''));
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
        if (!useChunks) {
            cache = await redisClient.get(`${cacheKey}-version-${CACHE_VERSION}`);
            if (cache) {
                cacheObj = JSON.parse(cache);
            }
        } else {
            const meta = await redisClient.get(`${cacheKey}-version-${CACHE_VERSION}-chunks-meta`);
            if (meta) {
                const metaObj = JSON.parse(meta);
                const arr = [...Array(metaObj.nbChunks).keys()];
                const chunks = await Promise.all(
                    arr.map((v, i) => {
                        return redisClient.get(`${cacheKey}-version-${CACHE_VERSION}-chunk-${i}`)
                    })
                )
                cache = chunks.join('');
                cacheObj = { ...metaObj, ...JSON.parse(cache) }
            }
        }
        if (cache) {
            const now = Date.now();
            return {
                data: cacheObj.data,
                timestamp: cacheObj?.timestamp,
                isValid: !checkForTime || ((now - cacheObj?.timestamp) / 1000 < cacheTime),
            };
        }
    } catch (e) {
        console.log(String(cacheKey).replace(/\n|\r/g, ''));
        console.log(e);
    }
    return { data: undefined, isValid: false };
}

export const redisSetWithTimestamp = async (key: string, data: any, useChunks = false) => {
    try {
        if (!useChunks) {
            const dataString = JSON.stringify({ timestamp: Date.now(), data });
            return await redisClient.set(`${key}-version-${CACHE_VERSION}`, dataString);
        }
        const dataString = JSON.stringify({ data });
        // 200k chars
        const nbChunks = Math.ceil(dataString.length / 200000);
        const dataStringMeta = JSON.stringify({ timestamp: Date.now(), nbChunks });
        const stringChunks = dataString.match(/.{1,200000}/g) ?? [];
        return await Promise.all([
            redisClient.set(`${key}-version-${CACHE_VERSION}-chunks-meta`, dataStringMeta),
            ...stringChunks.map((chunk, i) => redisClient.set(`${key}-version-${CACHE_VERSION}-chunk-${i}`, chunk))
        ]);
    } catch (e) {
        console.log(e);
        return
    }
}

export const isInvalidGenericParam = (value: string) => {
    return !!value && !/^[0-9a-zA-Z-]+$/.test(value);
}
