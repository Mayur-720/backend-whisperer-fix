const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const { getRedisClient } = require("../utils/redisClient");

// Cache JWT secret for better performance
const JWT_SECRET = process.env.JWT_SECRET;

// User cache TTL (5 minutes)
const USER_CACHE_TTL = 300;

const protect = asyncHandler(async (req, res, next) => {
	let token;

	if (
		req.headers.authorization &&
		req.headers.authorization.startsWith("Bearer")
	) {
		try {
			token = req.headers.authorization.split(" ")[1];

			// Verify token
			const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

			if (!decoded?.id) {
				res.status(401);
				throw new Error("Invalid token payload");
			}

			const redis = getRedisClient();
			const userCacheKey = `user:${decoded.id}`;

			// Try to get user from cache first
			let user = null;
			if (redis.isAvailable()) {
				try {
					const cachedUser = await redis.get(userCacheKey);
					if (cachedUser) {
						try {
							// If cachedUser is a string, parse it; otherwise, use it as-is
							const user =
								typeof cachedUser === "string"
									? JSON.parse(cachedUser)
									: cachedUser;
							req.user = user; // Assuming this is the intent of the middleware
						} catch (parseErr) {
							console.error(
								"User cache parsing error:",
								parseErr,
								"value:",
								cachedUser
							);
							await redis.del(userCacheKey);
						}
					}
				} catch (error) {
					console.error("User cache retrieval error:", error);
				}
			}

			// If not in cache, get from database
			if (!user) {
				user = await User.findById(decoded.id).select("-password").lean(); // Use lean() for better performance

				if (!user) {
					res.status(401);
					throw new Error("User not found");
				}

				// Cache the user for future requests
				if (redis.isAvailable()) {
					try {
						await redis.del(userCacheKey); // Force clear before write
						await redis.setex(
							userCacheKey,
							USER_CACHE_TTL,
							JSON.stringify(user)
						);
					} catch (error) {
						console.error("User cache storage error:", error);
					}
				}
			}

			// Attach user to request object
			req.user = user;
			next();
		} catch (error) {
			console.error("Token verification error:", error.message);

			let errorMessage = "Not authorized, invalid token";
			let statusCode = 401;

			if (error.name === "TokenExpiredError") {
				errorMessage = "Token expired, please log in again";
			} else if (error.name === "JsonWebTokenError") {
				errorMessage = "Malformed token";
			} else if (error.message === "User not found") {
				errorMessage = "Not authorized, user not found";
			}

			res.status(statusCode);
			throw new Error(errorMessage);
		}
	} else {
		res.status(401);
		throw new Error("Not authorized, no token provided");
	}
});

const socketAuth = async (socket, next) => {
	const token = socket.handshake.auth.token;

	if (!token) {
		return next(new Error("Authentication error: No token provided"));
	}

	try {
		const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

		if (!decoded?.id) {
			return next(new Error("Authentication error: Invalid token payload"));
		}

		const redis = getRedisClient();
		const userCacheKey = `user:${decoded.id}`;

		// Try to get user from cache first
		let user = null;
		if (redis.isAvailable()) {
			try {
				const cachedUser = await redis.get(userCacheKey);
				if (cachedUser) {
					if (cachedUser === "[object Object]") {
						console.warn(
							`Invalid cache value for ${userCacheKey}:`,
							cachedUser
						);
						await redis.del(userCacheKey);
					} else {
						try {
							user = JSON.parse(cachedUser);
						} catch (parseErr) {
							console.error(
								"Socket user cache parsing error:",
								parseErr,
								"value:",
								cachedUser
							);
							await redis.del(userCacheKey);
							user = null;
						}
					}
				}
			} catch (error) {
				console.error("Socket user cache retrieval error:", error);
			}
		}

		// If not in cache, get from database
		if (!user) {
			user = await User.findById(decoded.id).select("-password").lean();

			if (!user) {
				return next(new Error("Authentication error: User not found"));
			}

			// Cache the user
			if (redis.isAvailable()) {
				try {
					await redis.del(userCacheKey); // Force clear before write
					await redis.setex(userCacheKey, USER_CACHE_TTL, JSON.stringify(user));
				} catch (error) {
					console.error("Socket user cache storage error:", error);
				}
			}
		}

		socket.user = user;
		next();
	} catch (error) {
		console.error("Socket authentication error:", error.message);

		let errorMessage = "Authentication error: Token verification failed";

		if (error.name === "TokenExpiredError") {
			errorMessage = "Authentication error: Token expired";
		} else if (error.name === "JsonWebTokenError") {
			errorMessage = "Authentication error: Invalid token";
		}

		return next(new Error(errorMessage));
	}
};

// Helper function to invalidate user cache
const invalidateUserCache = async (userId) => {
	const redis = getRedisClient();
	if (redis.isAvailable()) {
		try {
			await redis.del(`user:${userId}`);
		} catch (error) {
			console.error("User cache invalidation error:", error);
		}
	}
};

module.exports = { protect, socketAuth, invalidateUserCache };
