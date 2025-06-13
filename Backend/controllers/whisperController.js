
// controllers/whisperController.js
const asyncHandler = require("express-async-handler");
const Whisper = require("../models/whisperModel");
const User = require("../models/userModel");

// @desc    Save a whisper message (for WebSocket and REST)
// @access  Private
const saveWhisper = asyncHandler(
	async ({ senderId, receiverId, content, senderAlias, senderEmoji }) => {
		try {
			const receiver = await User.findById(receiverId);
			if (!receiver) {
				console.error(`Receiver not found for ID: ${receiverId}`);
				throw new Error("Receiver not found");
			}

			const messageCount = await Whisper.countDocuments({
				$or: [
					{ sender: senderId, receiver: receiverId },
					{ sender: receiverId, receiver: senderId },
				],
			});

			const visibilityLevel = Math.min(3, Math.floor(messageCount / 10));

			const whisper = await Whisper.create({
				sender: senderId,
				receiver: receiverId,
				content,
				senderAlias,
				senderEmoji,
				read: false,
				visibilityLevel,
			});

			// Save notification
			const notification = await Notification.create({
				title: `New Whisper from ${senderAlias} ${senderEmoji}`,
				message: content,
				userId: receiverId,
			});

			// Emit Socket.IO event to receiver's individual room and conversation room
			if (global.io) {
				global.io.to(receiverId.toString()).emit("notification", {
					title: `New Whisper from ${senderAlias} ${senderEmoji}`,
					body: content,
				});
				const room = [senderId.toString(), receiverId.toString()]
					.sort()
					.join(":");
				global.io.to(room).emit("notification", {
					title: `New Whisper from ${senderAlias} ${senderEmoji}`,
					body: content,
				});
				console.log(`Notification emitted to ${receiverId} and room ${room}`);
			} else {
				console.warn("global.io not initialized");
			}

			return whisper;
		} catch (error) {
			console.error(
				`Error saving whisper from ${senderId} to ${receiverId}:`,
				error.message
			);
			throw error;
		}
	}
);

// @desc    Send a new whisper message (REST)
// @route   POST /api/whispers
// @access  Private
const sendWhisper = asyncHandler(async (req, res) => {
	const { receiverId, content } = req.body;

	if (!receiverId || !content) {
		console.error("Missing receiverId or content in sendWhisper request");
		res.status(400);
		throw new Error("Please provide receiver and message content");
	}

	const whisper = await saveWhisper({
		senderId: req.user._id,
		receiverId,
		content,
		senderAlias: req.user.anonymousAlias,
		senderEmoji: req.user.avatarEmoji,
	});

	// Emit whisper to conversation room for real-time update
	if (global.io) {
		const room = [req.user._id.toString(), receiverId].sort().join(":");
		global.io.to(room).emit("receiveWhisper", whisper);
	}

	res.status(201).json(whisper);
});

// @desc    Get all whispers for current user
// @route   GET /api/whispers
// @access  Private
const getMyWhispers = asyncHandler(async (req, res) => {
	try {
		const conversations = await Whisper.aggregate([
			{
				$match: {
					$or: [{ sender: req.user._id }, { receiver: req.user._id }],
				},
			},
			{
				$sort: { createdAt: -1 },
			},
			{
				$group: {
					_id: {
						$cond: [{ $eq: ["$sender", req.user._id] }, "$receiver", "$sender"],
					},
					lastMessage: { $first: "$$ROOT" },
					messages: { $push: "$$ROOT" },
				},
			},
			{
				$lookup: {
					from: "users",
					localField: "_id",
					foreignField: "_id",
					as: "userDetails",
				},
			},
			{
				$project: {
					_id: 1,
					lastMessage: 1,
					unreadCount: {
						$size: {
							$filter: {
								input: "$messages",
								as: "msg",
								cond: {
									$and: [
										{ $eq: ["$$msg.receiver", req.user._id] },
										{ $eq: ["$$msg.read", false] },
									],
								},
							},
						},
					},
					partner: {
						_id: { $arrayElemAt: ["$userDetails._id", 0] },
						anonymousAlias: {
							$arrayElemAt: ["$userDetails.anonymousAlias", 0],
						},
						avatarEmoji: { $arrayElemAt: ["$userDetails.avatarEmoji", 0] },
						username: {
							$cond: {
								if: {
									$in: [
										{ $arrayElemAt: ["$userDetails._id", 0] },
										req.user.recognizedUsers.map((ru) => ru.toString()),
									],
								},
								then: { $arrayElemAt: ["$userDetails.username", 0] },
								else: null,
							},
						},
					},
				},
			},
			{
				$sort: { "lastMessage.createdAt": -1 },
			},
		]);

		res.json(conversations);
	} catch (error) {
		console.error(
			`Error fetching whispers for user ${req.user._id}:`,
			error.message
		);
		throw error;
	}
});

// @desc    Get whisper conversation with specific user
// @route   GET /api/whispers/:userId
// @access  Private
const getWhisperConversation = asyncHandler(async (req, res) => {
	const partnerId = req.params.userId;

	try {
		const partnerExists = await User.findById(partnerId);
		if (!partnerExists) {
			console.error(`Partner not found for ID: ${partnerId}`);
			res.status(404);
			throw new Error("User not found");
		}

		const messages = await Whisper.find({
			$or: [
				{ sender: req.user._id, receiver: partnerId },
				{ sender: partnerId, receiver: req.user._id },
			],
		}).sort({ createdAt: 1 });

		const hasRecognized = req.user.recognizedUsers.some(
			(ru) => ru && ru.toString() === partnerId
		);

		let partnerInfo = {
			_id: partnerExists._id,
			anonymousAlias: partnerExists.anonymousAlias,
			avatarEmoji: partnerExists.avatarEmoji,
		};

		if (hasRecognized) {
			partnerInfo.username = partnerExists.username;
		}

		res.json({
			messages,
			partner: partnerInfo,
			hasRecognized,
		});
	} catch (error) {
		console.error(
			`Error fetching conversation with ${partnerId}:`,
			error.message
		);
		throw error;
	}
});

// @desc    Mark a whisper as read
// @route   PUT /api/whispers/:whisperId/read
// @access  Private
const markWhisperAsRead = asyncHandler(async (req, res) => {
	const whisperId = req.params.whisperId;

	try {
		const whisper = await Whisper.findById(whisperId);
		if (!whisper) {
			console.error(`Whisper not found for ID: ${whisperId}`);
			res.status(404);
			throw new Error("Whisper not found");
		}

		if (whisper.receiver.toString() !== req.user._id.toString()) {
			console.error(
				`Unauthorized read attempt by ${req.user._id} for whisper ${whisperId}`
			);
			res.status(403);
			throw new Error("Not authorized to mark this whisper as read");
		}

		whisper.read = true;
		await whisper.save();

		res.json(whisper);
	} catch (error) {
		console.error(`Error marking whisper ${whisperId} as read:`, error.message);
		throw error;
	}
});

// @desc    Delete conversation with a specific user
// @route   DELETE /api/whispers/conversation/:userId
// @access  Private
const deleteConversation = asyncHandler(async (req, res) => {
	const partnerId = req.params.userId;

	try {
		// Delete all whispers between current user and the partner
		const result = await Whisper.deleteMany({
			$or: [
				{ sender: req.user._id, receiver: partnerId },
				{ sender: partnerId, receiver: req.user._id },
			],
		});

		res.json({
			message: "Conversation deleted successfully",
			deletedCount: result.deletedCount,
		});
	} catch (error) {
		console.error(
			`Error deleting conversation between ${req.user._id} and ${partnerId}:`,
			error.message
		);
		throw error;
	}
});

module.exports = {
	sendWhisper,
	getMyWhispers,
	getWhisperConversation,
	saveWhisper,
	markWhisperAsRead,
	deleteConversation,
};
