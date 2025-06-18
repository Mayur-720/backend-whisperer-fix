// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  addFriend,
  getMyFriends,
  recognizeUser,
  getRecognitions,
  revokeRecognition,
  getUserById,
  updateOneSignalPlayerId,
  getUserPosts,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification-email", resendVerificationEmail);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:resettoken", resetPassword);

// Protected routes
router.get("/profile", protect, getUserProfile);
router.get("/profile/:userId", protect, getUserById);
router.put("/profile", protect, updateUserProfile);
router.post("/friends", protect, addFriend);
router.get("/friends", protect, getMyFriends);
router.post("/recognize", protect, recognizeUser);
router.get("/recognitions", protect, getRecognitions);
router.post("/revoke-recognition", protect, revokeRecognition);
router.post("/onesignal-player-id", protect, updateOneSignalPlayerId);
router.get("/userposts/:userId", protect, getUserPosts);

module.exports = router;
