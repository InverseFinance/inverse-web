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
) => {
    try {
        const cache = await redisClient.get(`${cacheKey}-version-${CACHE_VERSION}`);
        if (cache) {
            const now = Date.now();
            const cacheObj = JSON.parse(cache);
            // we don't use redis.expire because it deletes the key when expired, we want to be able to get data in case of error
            if (!checkForTime || ((now - cacheObj?.timestamp) / 1000 < cacheTime)) {
                return cacheObj.data;
            }
        }
    } catch (e) {
        console.log(e);
    }
    return undefined;
}

export const redisSetWithTimestamp = async (key: string, data: any) => {
    try {
        return await redisClient.set(`${key}-version-${CACHE_VERSION}`, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) {
        console.log(e);
        return
    }
}

export const isInvalidGenericParam = (value: string) => {
    return !!value && !/^[0-9a-zA-Z-]+$/.test(value);
}