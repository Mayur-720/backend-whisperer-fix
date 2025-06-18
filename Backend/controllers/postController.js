const asyncHandler = require("express-async-handler");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const GhostCircle = require("../models/ghostCircleModel");
const mongoose = require("mongoose");
const { getRedisClient } = require("../utils/redisClient");
const cloudinary = require("cloudinary").v2;

// Cache keys
const CACHE_KEYS = {
	GLOBAL_FEED: "global_feed",
	GHOST_CIRCLE_POSTS: (id) => `ghost_circle_posts_${id}`,
	POST_DETAIL: (id) => `post_detail_${id}`,
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
	GLOBAL_FEED: 300, // 5 minutes
	GHOST_CIRCLE_POSTS: 600, // 10 minutes
	POST_DETAIL: 1800, // 30 minutes
};

// Configure Cloudinary (load creds from env or config)
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ddtqri4py",
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to invalidate related caches
const invalidatePostCaches = async (postId, ghostCircleId = null) => {
	try {
		const redis = getRedisClient();
		if (redis.isAvailable()) {
			const keysToDelete = [
				CACHE_KEYS.GLOBAL_FEED,
				CACHE_KEYS.POST_DETAIL(postId),
			];

			if (ghostCircleId) {
				keysToDelete.push(CACHE_KEYS.GHOST_CIRCLE_POSTS(ghostCircleId));
			}

			await Promise.all(keysToDelete.map((key) => redis.del(key)));
		}
	} catch (error) {
		console.error("Cache invalidation error:", error);
	}
};

// @desc    Create a new post (global or in ghost circle)
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
	const { content, ghostCircleId, imageUrl, images, videos, expiresIn } =
		req.body;

	// Check if content, image, or video is provided
	if (
		!content &&
		!imageUrl &&
		(!images || images.length === 0) &&
		(!videos || videos.length === 0)
	) {
		res.status(400);
		throw new Error("Please add content, image, or video to your post");
	}

	// Calculate expiry time (default 24 hours)
	const expiryTime = new Date();
	expiryTime.setHours(expiryTime.getHours() + (expiresIn || 24));

	// Prepare the post data
	const postData = {
		user: req.user._id,
		content: content || "",
		imageUrl: imageUrl || "",
		images: images || [],
		videos: videos || [],
		anonymousAlias: req.user.anonymousAlias,
		avatarEmoji: req.user.avatarEmoji,
		expiresAt: expiryTime,
	};

	// Check if the post is for a specific ghost circle
	if (ghostCircleId) {
		// Check if ghost circle exists and user is a member (with lean query)
		const ghostCircle = await GhostCircle.findById(ghostCircleId).lean();

		if (!ghostCircle) {
			res.status(404);
			throw new Error("Ghost circle not found");
		}

		const isMember = ghostCircle.members.some(
			(member) => member.userId.toString() === req.user._id.toString()
		);

		if (!isMember) {
			res.status(403);
			throw new Error("Not authorized to post in this ghost circle");
		}

		postData.ghostCircle = ghostCircleId;
	}

	// Use session for atomic operations
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		// Create the post
		const [post] = await Post.create([postData], { session });

		// Add post ID to the user's posts array
		await User.findByIdAndUpdate(
			req.user._id,
			{ $push: { posts: post._id } },
			{ session }
		);

		// If posting to a ghost circle, add post to the circle's posts
		if (ghostCircleId) {
			await GhostCircle.findByIdAndUpdate(
				ghostCircleId,
				{ $push: { posts: post._id } },
				{ session }
			);
		}

		await session.commitTransaction();

		// Invalidate related caches
		await invalidatePostCaches(post._id, ghostCircleId);

		res.status(201).json(post);
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = asyncHandler(async (req, res) => {
	const { content, imageUrl, images, videos } = req.body;

	const post = await Post.findById(req.params.id);

	if (!post) {
		res.status(404);
		throw new Error("Post not found");
	}

	// Check if user is the post author
	if (post.user.toString() !== req.user._id.toString()) {
		res.status(403);
		throw new Error("Not authorized to update this post");
	}

	// Update post fields efficiently
	const updateFields = {};
	if (content !== undefined) updateFields.content = content;
	if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;
	if (images !== undefined) updateFields.images = images;
	if (videos !== undefined) updateFields.videos = videos;

	const updatedPost = await Post.findByIdAndUpdate(
		req.params.id,
		updateFields,
		{ new: true, runValidators: true }
	);

	// Invalidate related caches
	await invalidatePostCaches(req.params.id, post.ghostCircle);

	res.json(updatedPost);
});

// @desc    Delete a post
// @route   DELETE /api/posts/delete/:postId
// @access  Private
const deletepost = asyncHandler(async (req, res) => {
	const post = await Post.findById(req.params.postId).lean();

	if (!post) {
		res.status(404);
		throw new Error("Post not found");
	}

	// Check if user is the post author
	if (post.user.toString() !== req.user._id.toString()) {
		res.status(403);
		throw new Error("Not authorized to delete this post");
	}

	// --- Delete any associated Cloudinary images/videos ---
	try {
		// Helper to get public_id from Cloudinary URL
		const extractPublicId = (url) => {
			if (!url) return null;
			const match = url.match(/upload\/(?:v\d+\/)?([^\.]+)\./);
			if (match && match[1]) return match[1];
			return null;
		};

		// Collect all image URLs
		let imagesToDelete = [];
		// Single deprecated imageUrl
		if (post.imageUrl && post.imageUrl.includes("cloudinary")) {
			imagesToDelete.push(post.imageUrl);
		}
		// Multiple images array
		if (post.images && Array.isArray(post.images)) {
			imagesToDelete.push(
				...post.images.filter((img) => img && img.includes("cloudinary"))
			);
		}
		// Videos array - delete their main file and thumbnails (if any)
		let videosToDelete = [];
		if (post.videos && Array.isArray(post.videos)) {
			post.videos.forEach((vid) => {
				if (vid.url && vid.url.includes("cloudinary")) {
					videosToDelete.push({ url: vid.url, resource_type: "video" });
				}
				if (vid.thumbnail && vid.thumbnail.includes("cloudinary")) {
					videosToDelete.push({ url: vid.thumbnail, resource_type: "image" });
				}
			});
		}

		// Delete images
		for (const imageUrl of imagesToDelete) {
			const pubId = extractPublicId(imageUrl);
			if (pubId) {
				await cloudinary.uploader.destroy(pubId, { resource_type: "image" });
			}
		}
		// Delete videos and thumbnails
		for (const vidObj of videosToDelete) {
			const pubId = extractPublicId(vidObj.url);
			if (pubId) {
				await cloudinary.uploader.destroy(pubId, {
					resource_type: vidObj.resource_type,
				});
			}
		}
	} catch (err) {
		console.error("Cloudinary deletion error:", err);
		// Don't throw, continue to delete post anyway
	}
	// --- END Cloudinary deletion ---

	await Post.findByIdAndDelete(req.params.postId);

	// Invalidate related caches
	await invalidatePostCaches(req.params.postId, post.ghostCircle);

	res.json({ message: "Post deleted successfully" });
});

// @desc    Get global feed posts (not in ghost circles) with pagination
// @route   GET /api/posts/global
// @access  Private

const getGlobalFeed = asyncHandler(async (req, res) => {
	const redis = getRedisClient();
	// Parse pagination params
	const limit = Math.min(Number(req.query.limit) || 20, 50); // cap limit to 50
	const after = req.query.after; // after is a post _id (ObjectId)

	// Build query
	const query = {
		ghostCircle: { $exists: false },
		expiresAt: { $gt: new Date() },
	};
	if (after) {
		// Only get posts with _id < after, meaning older than the last loaded
		query._id = { $lt: after };
	}

	// Try to get from cache when no pagination, no after/limit (default case)
	if (!after && limit === 20 && redis.isAvailable()) {
		try {
			const cachedPosts = await redis.get(CACHE_KEYS.GLOBAL_FEED);
			if (cachedPosts) {
				try {
					// If cachedPosts is a string, parse it; otherwise, use it as-is
					const parsedPosts =
						typeof cachedPosts === "string"
							? JSON.parse(cachedPosts)
							: cachedPosts;
					if (Array.isArray(parsedPosts)) {
						return res.status(200).json({
							posts: parsedPosts,
							hasMore: parsedPosts.length === limit,
						});
					} else {
						console.warn("Invalid cached posts data:", parsedPosts);
						await redis.del(CACHE_KEYS.GLOBAL_FEED);
					}
				} catch (error) {
					console.error("Cache retrieval error:", error, "value:", cachedPosts);
					await redis.del(CACHE_KEYS.GLOBAL_FEED);
				}
			}
		} catch (error) {
			console.error("Cache retrieval error:", error);
		}
	}

	// Paginated DB query
	const posts = await Post.find(query)
		.sort({ _id: -1 }) // newest first
		.limit(limit)
		.lean();

	// Only cache first/default (unpaginated) page
	if (!after && limit === 20 && redis.isAvailable()) {
		try {
			await redis.del(CACHE_KEYS.GLOBAL_FEED); // Force clear before write
			await redis.setex(
				CACHE_KEYS.GLOBAL_FEED,
				CACHE_TTL.GLOBAL_FEED,
				JSON.stringify(posts)
			);
		} catch (error) {
			console.error("Cache storage error:", error);
		}
	}

	// Return results + hasMore flag for infinite scroll
	const hasMore = posts.length === limit;
	console.log("Global feed response:", { posts, hasMore });
	res.status(200).json({ posts, hasMore });
});

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
	const { content, anonymousAlias } = req.body;

	if (!content || !anonymousAlias) {
		return res
			.status(400)
			.json({ message: "Comment content and alias are required" });
	}

	try {
		const newComment = {
			user: req.user._id,
			content,
			anonymousAlias,
			avatarEmoji: req.user.avatarEmoji || "🎭",
			_id: new mongoose.Types.ObjectId(),
		};

		const post = await Post.findByIdAndUpdate(
			req.params.id,
			{ $push: { comments: { $each: [newComment], $position: 0 } } },
			{ new: true, runValidators: true }
		);

		if (!post) {
			return res.status(404).json({ message: "Post not found" });
		}

		// Invalidate related caches
		await invalidatePostCaches(req.params.id, post.ghostCircle);

		res.status(201).json({
			message: "Comment added successfully",
			comment: newComment,
		});
	} catch (err) {
		res.status(500).json({
			message: "Server error",
			error: err.message,
		});
	}
});

// @desc    Edit a comment
// @route   PUT /api/posts/:id/comments/:commentId
// @access  Private
const editComment = asyncHandler(async (req, res) => {
	const { content } = req.body;

	if (!content) {
		res.status(400);
		throw new Error("Comment content is required");
	}

	try {
		const post = await Post.findOneAndUpdate(
			{
				_id: req.params.id,
				"comments._id": req.params.commentId,
				"comments.user": req.user._id,
			},
			{
				$set: { "comments.$.content": content },
			},
			{ new: true }
		);

		if (!post) {
			res.status(404);
			throw new Error("Post or comment not found, or not authorized");
		}

		const updatedComment = post.comments.id(req.params.commentId);

		// Invalidate related caches
		await invalidatePostCaches(req.params.id, post.ghostCircle);

		res.json({
			message: "Comment updated successfully",
			comment: updatedComment,
		});
	} catch (error) {
		console.error("Edit comment error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @desc    Delete a comment
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			res.status(404);
			throw new Error("Post not found");
		}

		const comment = post.comments.id(req.params.commentId);
		if (!comment) {
			res.status(404);
			throw new Error("Comment not found");
		}

		const isCommentAuthor = comment.user.toString() === req.user._id.toString();
		const isPostAuthor = post.user.toString() === req.user._id.toString();

		if (!isCommentAuthor && !isPostAuthor) {
			res.status(403);
			throw new Error("Not authorized to delete this comment");
		}

		// Use pull to remove the comment
		await Post.findByIdAndUpdate(req.params.id, {
			$pull: { comments: { _id: req.params.commentId } },
		});

		// Invalidate related caches
		await invalidatePostCaches(req.params.id, post.ghostCircle);

		res.json({ message: "Comment deleted successfully" });
	} catch (error) {
		console.error("Delete comment error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @desc    Reply to a comment
// @route   POST /api/posts/:id/comments/:commentId/reply
// @access  Private
const replyToComment = asyncHandler(async (req, res) => {
	const { content, anonymousAlias } = req.body;

	if (!content || !anonymousAlias) {
		res.status(400);
		throw new Error("Reply content and alias are required");
	}

	try {
		const reply = {
			user: req.user._id,
			content,
			anonymousAlias,
			avatarEmoji: req.user.avatarEmoji || "🎭",
			_id: new mongoose.Types.ObjectId(),
			createdAt: new Date(),
		};

		const post = await Post.findOneAndUpdate(
			{
				_id: req.params.id,
				"comments._id": req.params.commentId,
			},
			{
				$push: { "comments.$.replies": reply },
			},
			{ new: true }
		);

		if (!post) {
			res.status(404);
			throw new Error("Post or comment not found");
		}

		// Invalidate related caches
		await invalidatePostCaches(req.params.id, post.ghostCircle);

		res.status(201).json({
			message: "Reply added successfully",
			reply,
		});
	} catch (error) {
		console.error("Reply to comment error:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
	const post = await Post.findById(req.params.id).select("comments").lean();
	if (!post) {
		res.status(404);
		throw new Error("Post not found");
	}
	res.json(post.comments);
});

// @desc    Get ghost circle posts
// @route   GET /api/posts/circle/:id
// @access  Private
const getGhostCirclePosts = asyncHandler(async (req, res) => {
	const redis = getRedisClient();
	const cacheKey = CACHE_KEYS.GHOST_CIRCLE_POSTS(req.params.id);

	// Try to get from cache first
	if (redis.isAvailable()) {
		try {
			const cachedPosts = await redis.get(cacheKey);
			if (cachedPosts) {
				return res.json(JSON.parse(cachedPosts));
			}
		} catch (error) {
			console.error("Cache retrieval error:", error);
		}
	}

	// Check if user is member of the ghost circle
	const ghostCircle = await GhostCircle.findById(req.params.id).lean();

	if (!ghostCircle) {
		res.status(404);
		throw new Error("Ghost circle not found");
	}

	const isMember = ghostCircle.members.some(
		(member) => member.userId.toString() === req.user._id.toString()
	);

	if (!isMember) {
		res.status(403);
		throw new Error("Not authorized to view posts in this ghost circle");
	}

	const posts = await Post.find({
		ghostCircle: req.params.id,
		expiresAt: { $gt: new Date() },
	})
		.sort({ createdAt: -1 })
		.lean();

	// Cache the result
	if (redis.isAvailable()) {
		try {
			await redis.setex(
				cacheKey,
				CACHE_TTL.GHOST_CIRCLE_POSTS,
				JSON.stringify(posts)
			);
		} catch (error) {
			console.error("Cache storage error:", error);
		}
	}

	res.json(posts);
});

// @desc    Like/unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = asyncHandler(async (req, res) => {
	const userId = req.user._id.toString();

	const post = await Post.findById(req.params.id);

	if (!post) {
		res.status(404);
		throw new Error("Post not found");
	}

	const alreadyLiked = post.likes.some(
		(like) => like.user.toString() === userId
	);

	let updateOperation;

	if (alreadyLiked) {
		// Remove like
		updateOperation = { $pull: { likes: { user: userId } } };
	} else {
		// Add like and extend post life
		updateOperation = {
			$push: {
				likes: {
					user: req.user._id,
					anonymousAlias: req.user.anonymousAlias,
				},
			},
		};

		// Extend post life by 1 hour if not expired
		if (post.expiresAt > new Date()) {
			updateOperation.$set = {
				expiresAt: new Date(post.expiresAt.getTime() + 60 * 60 * 1000),
			};
		}
	}

	const updatedPost = await Post.findByIdAndUpdate(
		req.params.id,
		updateOperation,
		{ new: true }
	);

	// Invalidate related caches
	await invalidatePostCaches(req.params.id, post.ghostCircle);

	res.json({
		likes: updatedPost.likes.length,
		expiresAt: updatedPost.expiresAt,
	});
});

// @desc    Try to recognize post author
// @route   POST /api/posts/:id/recognize
// @access  Private
const recognizeUser = asyncHandler(async (req, res) => {
	const { guessUsername } = req.body;

	if (!guessUsername) {
		res.status(400);
		throw new Error("Please provide a username guess");
	}

	const post = await Post.findById(req.params.id).lean();

	if (!post) {
		res.status(404);
		throw new Error("Post not found");
	}

	// Find the guessed user
	const guessedUser = await User.findOne({ username: guessUsername }).lean();

	if (!guessedUser) {
		return res.status(200).json({
			correct: false,
			message: "No user found with that username",
		});
	}

	// Check if guess is correct
	const isCorrect = post.user.toString() === guessedUser._id.toString();

	if (isCorrect) {
		// Check if already recognized
		const currentUser = await User.findById(req.user._id).lean();
		const alreadyRecognized = currentUser.recognizedUsers?.some(
			(ru) => ru.userId.toString() === post.user.toString()
		);

		if (!alreadyRecognized) {
			// Use atomic operations to update both users
			await Promise.all([
				User.findByIdAndUpdate(req.user._id, {
					$push: {
						recognizedUsers: {
							userId: post.user,
							recognizedAt: new Date(),
						},
					},
				}),
				User.findByIdAndUpdate(post.user, {
					$push: {
						identityRecognizers: {
							userId: req.user._id,
							recognizedAt: new Date(),
						},
					},
				}),
			]);
		}

		return res.json({
			correct: true,
			message: "Correct! You recognized the user.",
			user: {
				_id: guessedUser._id,
				username: guessedUser.username,
				avatarEmoji: guessedUser.avatarEmoji,
			},
		});
	} else {
		return res.json({
			correct: false,
			message: "Incorrect guess. Try again!",
		});
	}
});

// @desc    Increment share count
// @route   PUT /api/posts/:postId/share
// @access  Private
const incrementShareCount = asyncHandler(async (req, res) => {
	const { postId } = req.params;

	const post = await Post.findByIdAndUpdate(
		postId,
		{ $inc: { shareCount: 1 } },
		{ new: true }
	);

	if (!post) {
		res.status(404);
		throw new Error("Post not found");
	}

	// Invalidate related caches
	await invalidatePostCaches(postId, post.ghostCircle);

	res.status(200).json({ shareCount: post.shareCount });
});

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Private
const getPostById = asyncHandler(async (req, res) => {
	const redis = getRedisClient();
	const cacheKey = CACHE_KEYS.POST_DETAIL(req.params.id);

	// Try to get from cache first
	if (redis.isAvailable()) {
		try {
			const cachedPost = await redis.get(cacheKey);
			if (cachedPost) {
				return res.json(JSON.parse(cachedPost));
			}
		} catch (error) {
			console.error("Cache retrieval error:", error);
		}
	}

	const post = await Post.findById(req.params.id)
		.populate("user", "anonymousAlias avatarEmoji username")
		.populate("comments.user", "anonymousAlias avatarEmoji")
		.lean();

	if (!post) {
		res.status(404);
		throw new Error("Post not found");
	}

	// Cache the result
	if (redis.isAvailable()) {
		try {
			await redis.setex(cacheKey, CACHE_TTL.POST_DETAIL, JSON.stringify(post));
		} catch (error) {
			console.error("Cache storage error:", error);
		}
	}

	res.json(post);
});

module.exports = {
	createPost,
	updatePost,
	deletepost,
	getGlobalFeed,
	getGhostCirclePosts,
	getPostById,
	likePost,
	recognizeUser,
	getComments,
	addComment,
	editComment,
	incrementShareCount,
	deleteComment,
	replyToComment,
};
