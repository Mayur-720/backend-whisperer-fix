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
router.post("/api/whispers", protect, sendWhisper); // Send a new whisper
router.get("/api/whispers", protect, getMyWhispers); // Get all whispers
router.get("/api/whispers/:userId", protect, getWhisperConversation); // Get conversation with specific user

module.exports = router;
