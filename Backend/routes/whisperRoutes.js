
// routes/whisperRoutes.js
const express = require("express");
const router = express.Router();
const whisperController = require("../controllers/whisper");
const { protect } = require("../middleware/authMiddleware");

// Protected routes
router
	.route("/")
	.post(protect, whisperController.sendWhisper) // Send a new whisper (REST)
	.get(protect, whisperController.getMyWhispers); // Get all user conversations

router.get("/:userId", protect, whisperController.getWhisperConversation); // Get conversation with a specific user

router.put("/:whisperId/read", protect, whisperController.markWhisperAsRead); // Mark a whisper as read

router.delete("/conversation/:userId", protect, whisperController.deleteConversation); // Delete conversation with a user

// New routes for editing and deleting a single whisper message:
router.put("/message/:messageId", protect, whisperController.editWhisperMessage); // Edit a single message
router.delete("/message/:messageId", protect, whisperController.deleteWhisperMessage); // Delete a single message

module.exports = router;
