import { createClient} from 'redis';

const sharedRedis = process.env.REDIS_HOST 
  ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.SHARED_DB}` 
  : 'redis://localhost:6379/{process.env.SHARED_DB}';

const sharedRedisClient = new createClient({url:sharedRedis});
try {

    await sharedRedisClient.connect();
    console.log("Redis connected successfully!");
} catch (err) {
    console.error("Redis connection failed during startup:", err);
}



export { sharedRedisClient };