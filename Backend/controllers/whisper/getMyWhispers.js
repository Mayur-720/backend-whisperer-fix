const asyncHandler = require("express-async-handler");
const Whisper = require("../../models/whisperModel");
const User = require("../../models/userModel");

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
module.exports = { getMyWhispers };
