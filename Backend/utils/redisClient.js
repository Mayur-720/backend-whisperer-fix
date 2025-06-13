const Redis = require('ioredis');

let redisClient;
let redisAvailable = false;

const initRedis = () => {
  if (!redisClient) {
    try {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err.message);
        redisAvailable = false;
      });

      redisClient.on('connect', () => {
        console.log('Connected to Redis');
        redisAvailable = true;
      });

      redisClient.on('ready', () => {
        redisAvailable = true;
      });
    } catch (err) {
      console.error('Failed to initialize Redis:', err.message);
      redisAvailable = false;
    }
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return {
    client: redisClient,
    isAvailable: () => redisAvailable,
    get: async (key) => {
      if (!redisAvailable) return null;
      try {
        return await redisClient.get(key);
      } catch (err) {
        console.error('Redis get error:', err.message);
        redisAvailable = false;
        return null;
      }
    },
    setex: async (key, seconds, value) => {
      if (!redisAvailable) return;
      try {
        await redisClient.setex(key, seconds, value);
      } catch (err) {
        console.error('Redis setex error:', err.message);
        redisAvailable = false;
      }
    },
    del: async (key) => {
      if (!redisAvailable) return;
      try {
        await redisClient.del(key);
      } catch (err) {
        console.error('Redis del error:', err.message);
        redisAvailable = false;
      }
    },
  };
};

module.exports = { initRedis, getRedisClient };