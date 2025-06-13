
const Redis = require('ioredis');

let redisClient;
let redisAvailable = false;

const initRedis = () => {
  if (!redisClient) {
    try {
      const redisOptions = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true, // Don't connect immediately
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableOfflineQueue: false, // Don't queue commands when disconnected
      };

      redisClient = new Redis(redisOptions);

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err.message);
        redisAvailable = false;
      });

      redisClient.on('connect', () => {
        console.log('✅ Connected to Redis');
        redisAvailable = true;
      });

      redisClient.on('ready', () => {
        console.log('✅ Redis client ready');
        redisAvailable = true;
      });

      redisClient.on('close', () => {
        console.log('❌ Redis connection closed');
        redisAvailable = false;
      });

      redisClient.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
        redisAvailable = false;
      });

      // Attempt to connect
      redisClient.connect().catch((err) => {
        console.log('⚠️ Redis connection failed, continuing without cache:', err.message);
        redisAvailable = false;
      });

    } catch (err) {
      console.error('❌ Failed to initialize Redis:', err.message);
      redisAvailable = false;
    }
  }
};

const getRedisClient = () => {
  return {
    client: redisClient,
    isAvailable: () => redisAvailable && redisClient?.status === 'ready',
    
    get: async (key) => {
      if (!redisAvailable || !redisClient) return null;
      try {
        const result = await redisClient.get(key);
        return result;
      } catch (err) {
        console.error('Redis get error:', err.message);
        redisAvailable = false;
        return null;
      }
    },
    
    setex: async (key, seconds, value) => {
      if (!redisAvailable || !redisClient) return false;
      try {
        await redisClient.setex(key, seconds, value);
        return true;
      } catch (err) {
        console.error('Redis setex error:', err.message);
        redisAvailable = false;
        return false;
      }
    },
    
    del: async (key) => {
      if (!redisAvailable || !redisClient) return false;
      try {
        await redisClient.del(key);
        return true;
      } catch (err) {
        console.error('Redis del error:', err.message);
        redisAvailable = false;
        return false;
      }
    },

    // Batch operations for better performance
    mget: async (keys) => {
      if (!redisAvailable || !redisClient || !keys.length) return [];
      try {
        return await redisClient.mget(...keys);
      } catch (err) {
        console.error('Redis mget error:', err.message);
        redisAvailable = false;
        return [];
      }
    },

    mset: async (keyValuePairs) => {
      if (!redisAvailable || !redisClient || !keyValuePairs.length) return false;
      try {
        await redisClient.mset(...keyValuePairs);
        return true;
      } catch (err) {
        console.error('Redis mset error:', err.message);
        redisAvailable = false;
        return false;
      }
    },

    // Health check
    ping: async () => {
      if (!redisAvailable || !redisClient) return false;
      try {
        const result = await redisClient.ping();
        return result === 'PONG';
      } catch (err) {
        console.error('Redis ping error:', err.message);
        redisAvailable = false;
        return false;
      }
    }
  };
};

// Graceful shutdown
process.on('SIGINT', async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed');
    } catch (err) {
      console.error('Error closing Redis connection:', err);
    }
  }
});

process.on('SIGTERM', async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed');
    } catch (err) {
      console.error('Error closing Redis connection:', err);
    }
  }
});

module.exports = { initRedis, getRedisClient };
