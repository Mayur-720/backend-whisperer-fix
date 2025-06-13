const express = require("express");
const router = express.Router();
const {
	registerUser,
	loginUser,
	getMyProfile,
	getUserProfileById,
	updateUserProfile,
	addFriend,
	getOwnPosts,
	processReferral,
	claimReward,
	verifyPayment,
	getReferralLeaderboard,
	recognizeUser,
	getRecognitions,
	revokeRecognition,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const {
	sendWhisper,
	getMyWhispers,
	getWhisperConversation,
} = require("../controllers/whisperController");
const User = require("../models/userModel");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/process-referral", processReferral);
router.get("/referral-leaderboard", getReferralLeaderboard);

router.post("/claim-reward", protect, claimReward);
router.get("/userposts/:userId", protect, getOwnPosts);
router.get("/profile", protect, getMyProfile);
router.get("/profile/:userId", protect, getUserProfileById);
router.post("/verify-payment", protect, verifyPayment);
router.put("/profile", protect, updateUserProfile);
router.post("/friends", protect, addFriend);

// New recognition routes
router.post("/recognize", protect, recognizeUser);
router.get("/recognitions", protect, getRecognitions);
router.post("/revoke-recognition", protect, revokeRecognition);

// New whisper routes
router.post("/api/whispers", protect, sendWhisper);
router.get("/api/whispers", protect, getMyWhispers);
router.get("/api/whispers/:userId", protect, getWhisperConversation);

// Add this route to update OneSignal player ID
router.post("/update-onesignal-id", protect, async (req, res) => {
	try {
		const { oneSignalPlayerId } = req.body;
		
		if (!oneSignalPlayerId) {
			return res.status(400).json({ message: "OneSignal player ID is required" });
		}

		const user = await User.findByIdAndUpdate(
			req.user._id,
			{ oneSignalPlayerId },
			{ new: true }
		).select('-password');

		res.json({ message: "OneSignal player ID updated successfully", user });
	} catch (error) {
		console.error("Error updating OneSignal player ID:", error);
		res.status(500).json({ message: "Failed to update OneSignal player ID" });
	}
});

module.exports = router;
