
const asyncHandler = require("express-async-handler");
const Whisper = require("../../models/whisperModel");

const deleteConversation = asyncHandler(async (req, res) => {
	const partnerId = req.params.userId;
	try {
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
module.exports = { deleteConversation };
