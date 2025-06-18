// controllers/userController.js
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
// FIXED: correct import for generateToken as a destructured object
const { generateToken } = require("../utils/jwtHelper"); 
const { generateAnonymousAlias, generateAvatar } = require("../utils/generators");
const Post = require("../models/postModel");
const { sendPasswordResetEmail, sendVerificationEmail, generateOTP } = require("../utils/emailService");
const crypto = require("crypto");

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
	const { username, fullName, email, password, referralCode, gender, interests } = req.body;

	if (!username || !fullName || !email || !password) {
		res.status(400);
		throw new Error("Please fill in all fields");
	}

	// Check if user exists
	const userExists = await User.findOne({ email });

	if (userExists) {
		res.status(400);
		throw new Error("User already exists");
	}

	// Generate anonymous alias and avatar
	const anonymousAlias = generateAnonymousAlias();
	const avatarEmoji = generateAvatar();

	// ---- EMAIL VERIFICATION ----
	const otp = generateOTP();
	const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 min from now

	// Create user
	const user = await User.create({
		username,
		fullName,
		email,
		password,
		anonymousAlias,
		avatarEmoji,
		referralCode,
		gender: gender || undefined,
		interests: interests || [],
		isEmailVerified: false,
		emailVerificationOTP: otp,
		emailVerificationOTPExpire: otpExpire,
	});

	// Send verification email
	try {
		await sendVerificationEmail(email, otp);
		console.log(`Verification email sent to ${email} with OTP: ${otp}`);
	} catch (emailError) {
		console.error("Failed to send verification email:", emailError);
		// Don't fail registration if email fails, but log it
	}

	if (user) {
		res.status(201).json({
			_id: user._id,
			username: user.username,
			fullName: user.fullName,
			email: user.email,
			anonymousAlias: user.anonymousAlias,
			avatarEmoji: user.avatarEmoji,
			isEmailVerified: user.isEmailVerified,
			token: generateToken(user._id),
		});
	} else {
		res.status(400);
		throw new Error("Invalid user data");
	}
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	console.log("[LOGIN ATTEMPT]", email);

	try {
		const user = await User.findOne({ email });
		console.log("[LOGIN] User record fetched:", user ? user.username : null);

		if (!user) {
			console.error("[LOGIN ERROR] User not found for email:", email);
			res.status(400);
			throw new Error("No account with this email. Please sign up first.");
		}

		if (!user.password) {
			console.error("[LOGIN ERROR] User has no password property:", user);
			res.status(500);
			throw new Error("User invalid: no password set.");
		}

		const validPassword = await user.matchPassword(password);

		console.log("[LOGIN] Password validation result:", validPassword);

		if (!validPassword) {
			console.error("[LOGIN ERROR] Wrong password for email:", email);
			res.status(400);
			throw new Error("Incorrect password. Please try again.");
		}

		console.log("[LOGIN SUCCESS]:", user.username, user._id);

		res.json({
			_id: user._id,
			username: user.username,
			fullName: user.fullName,
			email: user.email,
			anonymousAlias: user.anonymousAlias,
			avatarEmoji: user.avatarEmoji,
			isEmailVerified: user.isEmailVerified,
			token: generateToken(user._id)
		});
	} catch (err) {
		console.error("[LOGIN CRITICAL ERROR]:", err);
		res.status(500).json({
			message: "An unexpected error occurred while logging in.",
			error: err.message,
			stack: err.stack
		});
	}
});

// @desc    Get user profile data
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id).select("-password");

	if (user) {
		res.json({
			_id: user._id,
			username: user.username,
			fullName: user.fullName,
			email: user.email,
			anonymousAlias: user.anonymousAlias,
			avatarEmoji: user.avatarEmoji,
			friends: user.friends,
			recognizedUsers: user.recognizedUsers,
			referralCode: user.referralCode,
			oneSignalPlayerId: user.oneSignalPlayerId,
			bio: user.bio || "",
			gender: user.gender,
			interests: user.interests || [],
			premiumMatchUnlocks: user.premiumMatchUnlocks || 0,
			isEmailVerified: user.isEmailVerified,
		});
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id);

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	user.username = req.body.username || user.username;
	user.fullName = req.body.fullName || user.fullName;
	user.email = req.body.email || user.email;
	user.avatarEmoji = req.body.avatarEmoji || user.avatarEmoji;
	user.bio = req.body.bio !== undefined ? req.body.bio : user.bio; 
	user.gender = req.body.gender || user.gender;
	user.interests = req.body.interests || user.interests;
	if (typeof req.body.premiumMatchUnlocks === 'number') {
		user.premiumMatchUnlocks = req.body.premiumMatchUnlocks;
	}

	if (req.body.password) {
		user.password = req.body.password;
	}

	const updatedUser = await user.save();

	res.json({
		_id: updatedUser._id,
		username: updatedUser.username,
		fullName: updatedUser.fullName,
		email: updatedUser.email,
		anonymousAlias: updatedUser.anonymousAlias,
		avatarEmoji: updatedUser.avatarEmoji,
		bio: updatedUser.bio || "",
		gender: updatedUser.gender,
		interests: updatedUser.interests || [],
		premiumMatchUnlocks: updatedUser.premiumMatchUnlocks || 0,
		isEmailVerified: updatedUser.isEmailVerified,
		token: generateToken(updatedUser._id),
	});
});

// @desc    Add a friend to user's friend list
// @route   POST /api/users/friends
// @access  Private
const addFriend = asyncHandler(async (req, res) => {
	const { friendUsername } = req.body;

	if (!friendUsername) {
		res.status(400);
		throw new Error("Please provide a username to add as a friend");
	}

	const friend = await User.findOne({ username: friendUsername });

	if (!friend) {
		res.status(404);
		throw new Error("User not found");
	}

	if (friend._id.toString() === req.user._id.toString()) {
		res.status(400);
		throw new Error("Cannot add yourself as a friend");
	}

	const user = await User.findById(req.user._id);

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	if (user.friends.includes(friend._id)) {
		res.status(400);
		throw new Error("User is already your friend");
	}

	user.friends.push(friend._id);
	await user.save();

	res.json({ message: "Friend added successfully" });
});

// @desc    Get all friends for current user
// @route   GET /api/users/friends
// @access  Private
const getMyFriends = asyncHandler(async (req, res) => {
	const user = await User.findById(req.user._id).populate("friends", "_id username fullName email anonymousAlias avatarEmoji");

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	res.json(user.friends);
});

// @desc    Recognize a user's identity
// @route   POST /api/users/recognize
// @access  Private
const recognizeUser = asyncHandler(async (req, res) => {
	const { targetUserId, guessedIdentity } = req.body;

	if (!targetUserId || !guessedIdentity) {
		res.status(400);
		throw new Error("Please provide the target user ID and your guess");
	}

	const targetUser = await User.findById(targetUserId);
	if (!targetUser) {
		res.status(404);
		throw new Error("Target user not found");
	}

	// Use case-insensitive and trim whitespace for comparison:
	if (
		guessedIdentity.trim().toLowerCase() === targetUser.username.trim().toLowerCase()
	) {
		const user = await User.findById(req.user._id);
		if (!user) {
			res.status(404);
			throw new Error("User not found");
		}

		if (user.recognizedUsers.includes(targetUserId)) {
			res.status(400);
			throw new Error("You have already recognized this user");
		}

		user.recognizedUsers.push(targetUserId);
		await user.save();

		res.json({ message: "Recognition successful" });
	} else {
		res.status(400);
		throw new Error("Incorrect identity guess");
	}
});

// @desc    Get recognitions for current user
// @route   GET /api/users/recognitions
// @access  Private
const getRecognitions = asyncHandler(async (req, res) => {
	const { type, filter } = req.query;
	const userId = req.user._id;

	const user = await User.findById(userId)
		.populate({
			path: "recognizedUsers",
			select: "_id username fullName email anonymousAlias avatarEmoji",
		})
		.populate({
			path: "identityRecognizers",
			select: "_id username fullName email anonymousAlias avatarEmoji",
		});

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	// Calculate stats
	const totalRecognized = user.recognizedUsers ? user.recognizedUsers.length : 0;
	const totalRecognizers = user.identityRecognizers ? user.identityRecognizers.length : 0;
	const recognitionAttempts = user.recognitionAttempts || 0;
	const successfulRecognitions = user.successfulRecognitions || 0;
	const recognitionRate =
		recognitionAttempts > 0
			? Math.round((successfulRecognitions / recognitionAttempts) * 100)
			: 0;

	// Prepare lists for response
	let recognizedArr = user.recognizedUsers || [];
	let recognizersArr = user.identityRecognizers || [];

	// Filter "mutual" if requested
	if (filter === "mutual") {
		const recognizedIds = new Set(recognizedArr.map((u) => u._id.toString()));
		const mutualArr = recognizersArr.filter((u) => recognizedIds.has(u._id.toString()));
		recognizersArr = mutualArr;
		// Also, you can show mutuals in recognizedArr if desired:
		recognizedArr = recognizedArr.filter((u) =>
			mutualArr.some((recognizer) => recognizer._id.equals(u._id))
		);
	}

	res.json({
		stats: {
			totalRecognized,
			totalRecognizers,
			recognitionRate,
			successfulRecognitions,
			recognitionAttempts,
		},
		recognized: recognizedArr,
		recognizers: recognizersArr,
	});
});

// @desc    Revoke recognition for a user
// @route   POST /api/users/revoke-recognition
// @access  Private
const revokeRecognition = asyncHandler(async (req, res) => {
	const { targetUserId } = req.body;

	if (!targetUserId) {
		res.status(400);
		throw new Error("Please provide the target user ID to revoke recognition");
	}

	const user = await User.findById(req.user._id);
	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	if (!user.recognizedUsers.includes(targetUserId)) {
		res.status(400);
		throw new Error("You have not recognized this user");
	}

	user.recognizedUsers = user.recognizedUsers.filter(
		(id) => id.toString() !== targetUserId
	);
	await user.save();

	res.json({ message: "Recognition revoked successfully" });
});

// @desc    Get user by ID
// @route   GET /api/users/profile/:userId
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
	const user = await User.findById(req.params.userId).select("-password");

	if (user) {
		res.json({
			_id: user._id,
			username: user.username,
			fullName: user.fullName,
			email: user.email,
			anonymousAlias: user.anonymousAlias,
			avatarEmoji: user.avatarEmoji,
			friends: user.friends,
			recognizedUsers: user.recognizedUsers,
			referralCode: user.referralCode,
			gender: user.gender,
			interests: user.interests || [],
			premiumMatchUnlocks: user.premiumMatchUnlocks || 0,
		});
	} else {
		res.status(404);
		throw new Error("User not found");
	}
});

// @desc    Update user's OneSignal player ID
// @route   POST /api/users/onesignal-player-id
// @access  Private
const updateOneSignalPlayerId = asyncHandler(async (req, res) => {
	const { playerId } = req.body;

	if (!playerId) {
		res.status(400);
		throw new Error("Player ID is required");
	}

	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			res.status(404);
			throw new Error("User not found");
		}

		user.oneSignalPlayerId = playerId;
		await user.save();

		console.log(`OneSignal player ID updated for user ${user._id}: ${playerId}`);

		res.json({
			message: "OneSignal player ID updated successfully",
			playerId: user.oneSignalPlayerId,
		});
	} catch (error) {
		console.error("Error updating OneSignal player ID:", error);
		res.status(500);
		throw new Error("Failed to update OneSignal player ID");
	}
});

// @desc    Get all posts by a user
// @route   GET /api/users/userposts/:userId
// @access  Private
const getUserPosts = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	// Validate userId presence
	if (!userId) {
		res.status(400);
		throw new Error("UserId is required");
	}

	// Make sure user exists
	const user = await User.findById(userId);

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	// Find posts created by this user
	const posts = await Post.find({ user: userId }).sort({ createdAt: -1 });

	res.json(posts);
});

// @desc    Send password reset email
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;

	if (!email) {
		res.status(400);
		throw new Error("Please provide an email address");
	}

	const user = await User.findOne({ email });

	if (!user) {
		res.status(404);
		throw new Error("No user found with this email address");
	}

	// Get reset token
	const resetToken = user.getResetPasswordToken();

	await user.save({ validateBeforeSave: false });

	try {
		await sendPasswordResetEmail(email, resetToken);

		res.status(200).json({
			success: true,
			message: "Password reset email sent successfully",
		});
	} catch (error) {
		console.error("Error sending password reset email:", error);
		user.resetPasswordToken = undefined;
		user.resetPasswordExpire = undefined;

		await user.save({ validateBeforeSave: false });

		res.status(500);
		throw new Error("Email could not be sent. Please try again later.");
	}
});

// @desc    Reset password
// @route   PUT /api/users/reset-password/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
	const { password } = req.body;

	if (!password) {
		res.status(400);
		throw new Error("Please provide a new password");
	}

	if (password.length < 6) {
		res.status(400);
		throw new Error("Password must be at least 6 characters long");
	}

	// Get hashed token
	const resetPasswordToken = crypto
		.createHash("sha256")
		.update(req.params.resettoken)
		.digest("hex");

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: { $gt: Date.now() },
	});

	if (!user) {
		res.status(400);
		throw new Error("Invalid or expired reset token");
	}

	// Set new password
	user.password = password;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpire = undefined;

	await user.save();

	res.status(200).json({
		success: true,
		message: "Password reset successful",
		token: generateToken(user._id),
	});
});

// @desc    Verify email
// @route   POST /api/users/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;

	if (!email || !otp) {
		res.status(400);
		throw new Error("Email and OTP are required");
	}

	// Validate email format
	const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	if (!emailRegex.test(email)) {
		res.status(400);
		throw new Error("Invalid email format");
	}

	// Validate OTP format (should be 6 digits)
	if (!/^\d{6}$/.test(otp)) {
		res.status(400);
		throw new Error("OTP must be exactly 6 digits");
	}

	const user = await User.findOne({ email });

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	if (user.isEmailVerified) {
		return res.status(400).json({ 
			success: false,
			message: "Email already verified" 
		});
	}

	if (!user.emailVerificationOTP || !user.emailVerificationOTPExpire) {
		res.status(400);
		throw new Error("No OTP generated. Please request a new verification email.");
	}

	if (user.emailVerificationOTPExpire < Date.now()) {
		// Clear expired OTP
		user.emailVerificationOTP = undefined;
		user.emailVerificationOTPExpire = undefined;
		await user.save();
		
		res.status(400);
		throw new Error("OTP has expired. Please request a new verification email.");
	}

	if (user.emailVerificationOTP !== otp) {
		res.status(400);
		throw new Error("Invalid OTP. Please check your code and try again.");
	}

	// Success - verify the email
	user.isEmailVerified = true;
	user.emailVerificationOTP = undefined;
	user.emailVerificationOTPExpire = undefined;
	await user.save();

	console.log(`Email verified successfully for user: ${user.email}`);

	res.status(200).json({ 
		success: true, 
		message: "Email verified successfully",
		user: {
			_id: user._id,
			email: user.email,
			isEmailVerified: user.isEmailVerified
		}
	});
});

// @desc    Resend email verification OTP
// @route   POST /api/users/resend-verification-email
// @access  Public
const resendVerificationEmail = asyncHandler(async (req, res) => {
	const { email } = req.body;

	if (!email) {
		res.status(400);
		throw new Error("Email is required");
	}

	// Validate email format
	const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	if (!emailRegex.test(email)) {
		res.status(400);
		throw new Error("Invalid email format");
	}

	const user = await User.findOne({ email });

	if (!user) {
		res.status(404);
		throw new Error("User not found");
	}

	if (user.isEmailVerified) {
		return res.status(400).json({ 
			success: false,
			message: "Email already verified" 
		});
	}

	// Check if we should rate limit (optional - prevent spam)
	const lastOTPTime = user.emailVerificationOTPExpire ? 
		new Date(user.emailVerificationOTPExpire.getTime() - 10 * 60 * 1000) : null;
	
	if (lastOTPTime && (Date.now() - lastOTPTime.getTime()) < 60000) { // 1 minute rate limit
		res.status(429);
		throw new Error("Please wait at least 1 minute before requesting a new OTP");
	}

	const otp = generateOTP();
	const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

	user.emailVerificationOTP = otp;
	user.emailVerificationOTPExpire = otpExpire;
	await user.save();

	try {
		await sendVerificationEmail(email, otp);
		console.log(`Verification email resent to ${email} with OTP: ${otp}`);

		res.status(200).json({ 
			success: true, 
			message: "Verification email resent successfully" 
		});
	} catch (error) {
		console.error("Failed to resend verification email:", error);
		res.status(500);
		throw new Error("Failed to send verification email. Please try again later.");
	}
});

module.exports = {
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
	resendVerificationEmail,
};
