const { Redis } = require("@upstash/redis");

let redisClient;
let redisAvailable = false;

const initRedis = () => {
	if (!redisClient) {
		try {
			console.log(
				"UPSTASH_REDIS_REST_URL:",
				process.env.UPSTASH_REDIS_REST_URL
			);
			console.log(
				"UPSTASH_REDIS_REST_TOKEN:",
				process.env.UPSTASH_REDIS_REST_TOKEN
			);
			redisClient = new Redis({
				url: process.env.UPSTASH_REDIS_REST_URL,
				token: process.env.UPSTASH_REDIS_REST_TOKEN,
			});

			// Test connection
			redisClient
				.set("test", "connection")
				.then(() => {
					console.log("✅ Connected to Redis");
					redisAvailable = true;
				})
				.catch((err) => {
					console.error("Redis Connection Failed:", err);
					redisAvailable = false;
				});
		} catch (err) {
			console.error("Failed to initialize Redis:", err);
			redisAvailable = false;
		}
	}
};

const getRedisClient = () => {
	return {
		client: redisClient,
		isAvailable: () => redisAvailable,

		get: async (key) => {
			if (!redisAvailable || !redisClient) return null;
			try {
				return await redisClient.get(key);
			} catch (err) {
				console.error("Redis get error:", err);
				redisAvailable = false;
				return null;
			}
		},

		setex: async (key, seconds, value) => {
			if (!redisAvailable || !redisClient) return false;
			try {
				await redisClient.set(key, value, { EX: seconds });
				return true;
			} catch (err) {
				console.error("Redis setex error:", err);
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
				console.error("Redis del error:", err);
				redisAvailable = false;
				return false;
			}
		},

		mget: async (keys) => {
			if (!redisAvailable || !redisClient || !keys.length) return [];
			try {
				return await redisClient.mget(keys);
			} catch (err) {
				console.error("Redis mget error:", err);
				redisAvailable = false;
				return [];
			}
		},

		mset: async (keyValuePairs) => {
			if (!redisAvailable || !redisClient || !keyValuePairs.length)
				return false;
			try {
				const entries = {};
				for (let i = 0; i < keyValuePairs.length; i += 2) {
					entries[keyValuePairs[i]] = keyValuePairs[i + 1];
				}
				await redisClient.mset(entries);
				return true;
			} catch (err) {
				console.error("Redis mset error:", err);
				redisAvailable = false;
				return false;
			}
		},

		ping: async () => {
			if (!redisAvailable || !redisClient) return false;
			try {
				await redisClient.set("ping", "pong");
				return (await redisClient.get("ping")) === "pong";
			} catch (err) {
				console.error("Redis ping error:", err);
				redisAvailable = false;
				return false;
			}
		},
	};
};

// Graceful shutdown (not needed for @upstash/redis as it's stateless)
process.on("SIGINT", () => {
	console.log(
		"Redis client does not require explicit shutdown with @upstash/redis"
	);
});

process.on("SIGTERM", () => {
	console.log(
		"Redis client does not require explicit shutdown with @upstash/redis"
	);
});

module.exports = { initRedis, getRedisClient };
