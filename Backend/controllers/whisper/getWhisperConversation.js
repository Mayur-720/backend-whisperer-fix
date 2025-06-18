
const asyncHandler = require("express-async-handler");
const Whisper = require("../../models/whisperModel");
const User = require("../../models/userModel");

// GET /api/whispers/:userId?limit=20&before=<msgId>
const getWhisperConversation = asyncHandler(async (req, res) => {
	const partnerId = req.params.userId;
	const limit = Math.min(Number(req.query.limit) || 20, 50);
	const before = req.query.before;

	try {
		const partnerExists = await User.findById(partnerId);
		if (!partnerExists) {
			console.error(`Partner not found for ID: ${partnerId}`);
			res.status(404);
			throw new Error("User not found");
		}

		// Pagination: build message query
		let messageQuery = {
			$or: [
				{ sender: req.user._id, receiver: partnerId },
				{ sender: partnerId, receiver: req.user._id },
			],
		};
		if (before) {
			messageQuery._id = { $lt: before };
		}

		// Sort newest first for pagination (descending _id)
		const messages = await Whisper.find(messageQuery)
			.sort({ _id: -1 })
			.limit(limit)
			.lean();

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

		// hasMore: if received limit, allow "load more"
		const hasMore = messages.length === limit;

		res.json({
			messages,
			partner: partnerInfo,
			hasRecognized,
			hasMore,
		});
	} catch (error) {
		console.error(
			`Error fetching conversation with ${partnerId}:`,
			error.message
		);
		throw error;
	}
});
module.exports = { getWhisperConversation };

