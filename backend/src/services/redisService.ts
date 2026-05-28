
import { Redis, type RedisOptions } from "ioredis";

const defaultRedisHost = "claret-quartz-driftless-87450.db.redis.io";
const defaultRedisPort = 17148;

function resolveRedisConnectionOptions(): RedisOptions {
  if (process.env.REDIS_URL) {
    const parsedRedisUrl = new URL(process.env.REDIS_URL);

    return {
      host: parsedRedisUrl.hostname,
      port: Number(parsedRedisUrl.port || (parsedRedisUrl.protocol === "rediss:" ? 6380 : 6379)),
      username: parsedRedisUrl.username || undefined,
      password: parsedRedisUrl.password || undefined,
      maxRetriesPerRequest: null
    };
  }

  return {
    host: process.env.REDIS_HOST ?? defaultRedisHost,
    port: Number(process.env.REDIS_PORT ?? defaultRedisPort),
    username: process.env.REDIS_USERNAME ?? "default",
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null
  };
}

export const redisConnectionOptions = resolveRedisConnectionOptions();

export const redis = new Redis(redisConnectionOptions);

redis.on("error", (error) => {
  if (process.env.NODE_ENV !== "test") {
    console.error(`Redis connection error: ${error.message}`);
  }
});

export const paperCacheKey = (assignmentId: string) => `paper:${assignmentId}`;
