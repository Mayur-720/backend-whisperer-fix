
const asyncHandler = require("express-async-handler");
const Whisper = require("../../models/whisperModel");

const editWhisperMessage = asyncHandler(async (req, res) => {
	const messageId = req.params.messageId;
	const content = req.body.content;
	const userId = req.user._id;

	console.log("[Backend] Received request to edit message:", messageId, "new content:", content, "by user:", userId);

	if (!content || typeof content !== "string" || !content.trim()) {
		res.status(400);
		throw new Error("New message content required.");
	}

	const whisper = await Whisper.findById(messageId);
	if (!whisper) {
		console.log("[Backend] Message not found with ID:", messageId);
		res.status(404);
		throw new Error("Message not found.");
	}

	// Only sender can edit
	if (whisper.sender.toString() !== userId.toString()) {
		console.log("[Backend] User not authorized:", userId, "whisper.sender:", whisper.sender);
		res.status(403);
		throw new Error("You are not authorized to edit this message.");
	}

	whisper.content = content;
	await whisper.save();

	// Emit real-time update
	if (global.io) {
		const room = [whisper.sender.toString(), whisper.receiver.toString()].sort().join(":");
		global.io.to(room).emit("whisperMessageEdited", whisper);
	}
	console.log("[Backend] Message edited successfully:", messageId);
	res.json(whisper);
});
module.exports = { editWhisperMessage };
