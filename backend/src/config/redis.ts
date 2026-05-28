import { Redis } from 'ioredis';
import { env } from './env.js';

const parsedRedisUrl = new URL(env.REDIS_URL);

export const redisConnection = {
  host: parsedRedisUrl.hostname,
  port: Number(parsedRedisUrl.port || 6379),
  username: parsedRedisUrl.username || undefined,
  password: parsedRedisUrl.password || undefined,
  maxRetriesPerRequest: null,
};

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
export const cacheRedis = new Redis(env.REDIS_URL);
