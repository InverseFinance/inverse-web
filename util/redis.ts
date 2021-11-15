import { WrappedNodeRedisClient, createNodeRedisClient } from 'handy-redis';

const redisClient: WrappedNodeRedisClient = createNodeRedisClient({
    url: process.env.REDIS_URL
});

export const getRedisClient = (): WrappedNodeRedisClient => {
    return redisClient;
}

export const getCacheFromRedis = async (
    cacheKey: string,
    checkForTime = true,
    cacheTime = 1800,
) => {
    const cache = await redisClient.get(cacheKey);

    if (cache) {
        const now = Date.now();
        const cacheObj = JSON.parse(cache);

        if (!checkForTime || ((now - cacheObj?.timestamp) / 1000 < cacheTime)) {
            return cacheObj.data;
        }
    }
    return undefined;
}