import { createClient} from 'redis';

const redisUrl = process.env.REDIS_HOST 
  ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_AUTH_DB}` 
  : 'redis://localhost:6379/0';

const sharedRedis = process.env.REDIS_HOST 
  ? `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.SHARED_DB}` 
  : 'redis://localhost:6379/${process.env.SHARED_DB}';
  
const redisClient = createClient({url:redisUrl});
const sharedRedisClient = new createClient({url:sharedRedis});
try {
    await redisClient.connect();
    await sharedRedisClient.connect();
    console.log("Redis connected successfully!");
} catch (err) {
    console.error("Redis connection failed during startup:", err);
}



export { redisClient,sharedRedisClient };