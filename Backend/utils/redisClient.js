const { Redis } = require("@upstash/redis");
const { v4: uuidv4 } = require("uuid");

let redisClient;
let redisAvailable = false;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

const initRedis = async () => {
	if (!redisClient) {
		try {
			redisClient = new Redis({
				url: process.env.UPSTASH_REDIS_REST_URL,
				token: process.env.UPSTASH_REDIS_REST_TOKEN,
			});

			// Test connection
			const testResult = await redisClient.set("test", "connection");
			if (testResult !== "OK") {
				throw new Error(`Redis connection test failed: ${testResult}`);
			}
			redisAvailable = true;

			// Clear cache on startup
			try {
				await redisClient.flushall();
				const keys = await redisClient.keys("*");
				if (process.env.NODE_ENV !== "production") {
					console.log("✅ Connected to Redis");
					console.log("🧹 Redis cache cleared on startup");
					console.log("Cache keys after flush:", keys);
				}
			} catch (flushErr) {
				console.error(
					"Failed to clear Redis cache on startup:",
					flushErr.message
				);
			}
		} catch (err) {
			console.error("Failed to initialize Redis:", err.message, err.stack);
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
			const readId = uuidv4();
			try {
				const value = await redisClient.get(key);
				return value;
			} catch (err) {
				console.error(
					`[ReadID: ${readId}] Redis get error:`,
					err.message,
					err.stack
				);
				redisAvailable = false;
				return null;
			}
		},

		setex: async (key, seconds, value) => {
			if (!redisAvailable || !redisClient) {
				const writeId = uuidv4();
				if (process.env.NODE_ENV !== "production") {
					console.warn(
						`[WriteID: ${writeId}] Redis not available for key ${key}`
					);
				}
				return false;
			}
			const writeId = uuidv4();
			try {
				if (value === null || value === undefined || value === "") {
					if (process.env.NODE_ENV !== "production") {
						console.warn(
							`[WriteID: ${writeId}] Skipping invalid value for key ${key}:`,
							value
						);
					}
					return false;
				}
				const stringValue =
					typeof value === "string" ? value : JSON.stringify(value);
				if (stringValue === "[object Object]") {
					console.error(
						`[WriteID: ${writeId}] Invalid stringified value for key ${key}:`,
						value
					);
					return false;
				}

				// Retry logic for set operation
				let lastError;
				for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
					try {
						const setResult = await redisClient.set(key, stringValue, {
							ex: seconds,
						});
						if (setResult === "OK") {
							return true;
						}
						lastError = new Error(`Redis set returned: ${setResult}`);
						if (process.env.NODE_ENV !== "production") {
							console.warn(
								`[WriteID: ${writeId}] Attempt ${attempt} failed for key ${key}: Result was ${setResult}`
							);
							if (attempt < RETRY_ATTEMPTS) {
								console.log(
									`[WriteID: ${writeId}] Retrying in ${RETRY_DELAY_MS}ms...`
								);
							}
						}
						if (attempt < RETRY_ATTEMPTS) {
							await new Promise((resolve) =>
								setTimeout(resolve, RETRY_DELAY_MS)
							);
						}
					} catch (err) {
						lastError = err;
						if (process.env.NODE_ENV !== "production") {
							console.warn(
								`[WriteID: ${writeId}] Attempt ${attempt} error for key ${key}:`,
								err.message
							);
							if (attempt < RETRY_ATTEMPTS) {
								console.log(
									`[WriteID: ${writeId}] Retrying in ${RETRY_DELAY_MS}ms...`
								);
							}
						}
						if (attempt < RETRY_ATTEMPTS) {
							await new Promise((resolve) =>
								setTimeout(resolve, RETRY_DELAY_MS)
							);
						}
					}
				}
				// If all attempts fail, throw the last error
				throw (
					lastError || new Error("All retry attempts failed without an error")
				);
			} catch (err) {
				console.error(
					`[WriteID: ${writeId}] Redis setex error:`,
					err.message,
					err.stack
				);
				redisAvailable = false;
				return false;
			}
		},

		del: async (key) => {
			if (!redisAvailable || !redisClient) return false;
			const delId = uuidv4();
			try {
				await redisClient.del(key);
				return true;
			} catch (err) {
				console.error(
					`[DelID: ${delId}] Redis del error:`,
					err.message,
					err.stack
				);
				redisAvailable = false;
				return false;
			}
		},

		mget: async (keys) => {
			if (!redisAvailable || !redisClient || !keys.length) return [];
			const readId = uuidv4();
			try {
				const values = await redisClient.mget(keys);
				return values;
			} catch (err) {
				console.error(
					`[ReadID: ${readId}] Redis mget error:`,
					err.message,
					err.stack
				);
				redisAvailable = false;
				return [];
			}
		},

		mset: async (keyValuePairs) => {
			if (!redisAvailable || !redisClient || !keyValuePairs.length)
				return false;
			const writeId = uuidv4();
			try {
				const entries = {};
				for (let i = 0; i < keyValuePairs.length; i += 2) {
					const key = keyValuePairs[i];
					const value = keyValuePairs[i + 1];
					if (value === null || value === undefined || value === "") {
						if (process.env.NODE_ENV !== "production") {
							console.warn(
								`[WriteID: ${writeId}] Skipping invalid value for key ${key}:`,
								value
							);
						}
						continue;
					}
					const stringValue =
						typeof value === "string" ? value : JSON.stringify(value);
					if (stringValue === "[object Object]") {
						console.error(
							`[WriteID: ${writeId}] Invalid stringified value for key ${key}:`,
							value
						);
						continue;
					}
					entries[key] = stringValue;
				}
				if (Object.keys(entries).length > 0) {
					await redisClient.mset(entries);
					return true;
				}
				return false;
			} catch (err) {
				console.error(
					`[WriteID: ${writeId}] Redis mset error:`,
					err.message,
					err.stack
				);
				redisAvailable = false;
				return false;
			}
		},

		ping: async () => {
			if (!redisAvailable || !redisClient) return false;
			const pingId = uuidv4();
			try {
				await redisClient.set("ping", "pong");
				const result = (await redisClient.get("ping")) === "pong";
				return result;
			} catch (err) {
				console.error(
					`[PingID: ${pingId}] Redis ping error:`,
					err.message,
					err.stack
				);
				redisAvailable = false;
				return false;
			}
		},
	};
};

// Graceful shutdown
process.on("SIGINT", () => {
	if (process.env.NODE_ENV !== "production") {
		console.log(
			"Redis client does not require explicit shutdown with @upstash/redis"
		);
	}
});

process.on("SIGTERM", () => {
	if (process.env.NODE_ENV !== "production") {
		console.log(
			"Redis client does not require explicit shutdown with @upstash/redis"
		);
	}
});

module.exports = { initRedis, getRedisClient };
