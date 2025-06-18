
const asyncHandler = require("express-async-handler");
const Whisper = require("../../models/whisperModel");

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
module.exports = { markWhisperAsRead };
