const { Redis } = require("@upstash/redis");

const INVITE_PREFIX = "invite:";
const INVITE_TTL_SEC = 2 * 60 * 60;

const memory = new Map();

function redisEnv() {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    return url && token ? { url, token } : null;
}

function getRedis() {
    const env = redisEnv();
    if (!env) return null;
    return new Redis({ url: env.url, token: env.token });
}

function kvRequiredOnVercel() {
    return process.env.VERCEL === "1" && redisEnv() === null;
}

async function saveInviteKey(key) {
    if (kvRequiredOnVercel()) {
        const err = new Error("KV_REQUIRED");
        err.code = "KV_REQUIRED";
        throw err;
    }
    const redis = getRedis();
    if (redis) {
        await redis.set(`${INVITE_PREFIX}${key}`, "1", { ex: INVITE_TTL_SEC });
        return;
    }
    const expireAt = Date.now() + INVITE_TTL_SEC * 1000;
    memory.set(key, expireAt);
    setTimeout(() => memory.delete(key), INVITE_TTL_SEC * 1000);
}

async function isInviteKeyValid(key) {
    const redis = getRedis();
    if (redis) {
        const v = await redis.get(`${INVITE_PREFIX}${key}`);
        return v != null;
    }
    const expireAt = memory.get(key);
    if (!expireAt || Date.now() > expireAt) {
        memory.delete(key);
        return false;
    }
    return true;
}

async function invalidateInviteKey(key) {
    const redis = getRedis();
    if (redis) {
        await redis.del(`${INVITE_PREFIX}${key}`);
        return;
    }
    memory.delete(key);
}

module.exports = {
    saveInviteKey,
    isInviteKeyValid,
    invalidateInviteKey,
};
