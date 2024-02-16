import { getCacheFromRedisAsObj, redisSetWithTimestamp } from "@app/util/redis";

export const setFrameCheckAction = async (frameId, step, value, fid) => {
    const key = `frames:${frameId}-${step}-fid${fid}`;
    const { data } = (await getCacheFromRedisAsObj(key)) || {};
    if (!!data) {
        return { alreadyUsed: true };
    } else {
        await redisSetWithTimestamp(key, { value });
    }
}