
const asyncHandler = require("express-async-handler");
const Whisper = require("../../models/whisperModel");

const deleteWhisperMessage = asyncHandler(async (req, res) => {
	const messageId = req.params.messageId;
	const userId = req.user._id;

	console.log("[Backend] Received request to delete message:", messageId, "by user:", userId);

	const whisper = await Whisper.findById(messageId);
	if (!whisper) {
		console.log("[Backend] Message not found with ID:", messageId);
		res.status(404);
		throw new Error("Message not found.");
	}

	// Only sender can delete
	if (whisper.sender.toString() !== userId.toString()) {
		console.log("[Backend] User not authorized:", userId, "whisper.sender:", whisper.sender);
		res.status(403);
		throw new Error("You are not authorized to delete this message.");
	}

	await whisper.deleteOne();

	// Emit real-time update
	if (global.io) {
		const room = [whisper.sender.toString(), whisper.receiver.toString()].sort().join(":");
		global.io.to(room).emit("whisperMessageDeleted", { _id: messageId });
	}
	console.log("[Backend] Message deleted successfully:", messageId);
	res.json({ success: true, message: "Message deleted." });
});
module.exports = { deleteWhisperMessage };
