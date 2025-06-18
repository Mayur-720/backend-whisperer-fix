
// Handles sending a new whisper message (REST)
const asyncHandler = require("express-async-handler");
const { saveWhisper } = require("./saveWhisper");

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

module.exports = { sendWhisper };
