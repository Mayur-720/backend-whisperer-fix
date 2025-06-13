// Backend/controllers/userController.js
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const generateStableCode = require('../utils/generateStableCode');
const Post = require('../models/postModel');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, fullName, email, password, referralCode } = req.body;

  if (!username || !fullName || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user instance without explicitly setting avatarEmoji
  const user = new User({
    username,
    fullName,
    email,
    password,
    referralCode: generateStableCode(),
    referralCount: 0,
    referredBy: null,
    friends: [],
    recognizedUsers: [],
    identityRecognizers: [],
    claimedRewards: [],
  });

  // Generate unique anonymous alias
  const anonymousAlias = await user.generateAnonymousAlias();
  user.anonymousAlias = anonymousAlias;

  // Handle referral logic before saving
  let referrer = null; // Declare referrer outside the block with a default value
  if (referralCode) {
    referrer = await User.findOne({ referralCode });
    if (!referrer) {
      console.warn(`Invalid referral code: ${referralCode}`);
    } else if (referrer._id.toString() === user._id.toString()) {
      console.warn('User attempted self-referral');
    } else if (user.referredBy) {
      console.warn('User already has a referrer');
    } else {
      user.referredBy = referrer._id;
      referrer.referralCount = (referrer.referralCount || 0) + 1;
      await referrer.save(); // Save referrer inside the block
    }
  }

  // Save user (this triggers the pre-save hook for avatarEmoji)
  await user.save();

  const token = generateToken(user._id);
  res.status(201).json({
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    anonymousAlias: user.anonymousAlias,
    avatarEmoji: user.avatarEmoji, // Will reflect the randomly assigned emoji
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    token,
  });
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email });

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found:', email);
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.log('Password mismatch for:', email);
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user._id);
  res.json({
    _id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    anonymousAlias: user.anonymousAlias,
    avatarEmoji: user.avatarEmoji,
    referralCount: user.referralCount,
    token,
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
'anonymousAlias username avatarEmoji bio identityRecognizers recognizedUsers claimedRewards referralCode referralCount'  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user);
});

// @desc    Get user profile by ID
// @route   GET /api/users/profile/:userId
// @access  Private
const getUserProfileById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Ensure userId is valid and different from the authenticated user
  if (!userId) {
    res.status(400);
    throw new Error('User ID is required');
  }

  const user = await User.findById(userId).select(
    'anonymousAlias username avatarEmoji bio identityRecognizers recognizedUsers claimedRewards'
  );

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Authorization check: Only allow access if the requester is the user themselves or a member of the same circle
  if (req.user._id.toString() !== userId) {
    const isMember = await isCircleMember(req.user._id, user);
    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to view this profile');
    }
  }

  res.json(user);
});

const isCircleMember = async (userId, targetUser) => {
  const userCircles = await User.findById(userId).select('ghostCircles');
  const targetCircles = await User.findById(targetUser._id).select('ghostCircles');
  return userCircles.ghostCircles.some((circle) =>
    targetCircles.ghostCircles.includes(circle)
  );
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (req.body.bio !== undefined) user.bio = req.body.bio;

  const updatedUser = await user.save();
  res.json({
    _id: updatedUser._id,
    username: updatedUser.username,
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    anonymousAlias: updatedUser.anonymousAlias,
    avatarEmoji: updatedUser.avatarEmoji,
    bio: updatedUser.bio,
    referralCount: updatedUser.referralCount,
  });
});

// @desc    Add friend by username
// @route   POST /api/users/friends
// @access  Private
const addFriend = asyncHandler(async (req, res) => {
  const { friendUsername } = req.body;

  if (!friendUsername) {
    res.status(400);
    throw new Error('Please provide a friend username');
  }

  const friend = await User.findOne({ username: friendUsername });
  if (!friend) {
    res.status(404);
    throw new Error('User not found');
  }

  if (friend._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot add yourself as a friend');
  }

  const user = await User.findById(req.user._id);
  if (user.friends.includes(friend._id)) {
    res.status(400);
    throw new Error('You are already friends with this user');
  }

  user.friends.push(friend._id);
  friend.friends.push(user._id);
  await user.save();
  await friend.save();

  res.status(200).json({ message: 'Friend added successfully' });
});

// @desc    Get user's own posts
// @route   GET /api/users/userposts/:userId
// @access  Private
const getOwnPosts = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const posts = await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('likes.user', 'username')
    .populate('comments.user', 'username');

  res.status(200).json(posts);
});

// @desc    Process referral
// @route   POST /api/users/process-referral
// @access  Public
const processReferral = asyncHandler(async (req, res) => {
  const { referralCode, referredUserId } = req.body;

  if (!referralCode || !referredUserId) {
    res.status(400);
    throw new Error('Referral code and referred user ID are required');
  }

  const referredUser = await User.findById(referredUserId);
  if (!referredUser) {
    res.status(404);
    throw new Error('Referred user not found');
  }

  if (referredUser.referredBy) {
    res.status(400);
    throw new Error('User already referred');
  }

  const referrer = await User.findOne({ referralCode });
  if (!referrer) {
    res.status(404);
    throw new Error('Invalid referral code');
  }

  if (referrer._id.toString() === referredUserId) {
    res.status(400);
    throw new Error('Cannot refer yourself');
  }

  referrer.referralCount = (referrer.referralCount || 0) + 1;
  referredUser.referredBy = referrer._id;
  await referrer.save();
  await referredUser.save();

  res.status(200).json({
    success: true,
    message: 'Referral processed successfully',
  });
});

// @desc    Get referral leaderboard
// @route   GET /api/users/referral-leaderboard
// @access  Public
const getReferralLeaderboard = asyncHandler(async (req, res) => {
  const users = await User.find({}, '_id anonymousAlias avatarEmoji referralCount');
  const leaderboardEntries = users
    .map((user) => ({
      userId: user._id.toString(),
      anonymousAlias: user.anonymousAlias,
      avatarEmoji: user.avatarEmoji,
      referralsCount: user.referralCount || 0,
    }))
    .sort((a, b) => b.referralsCount - a.referralsCount)
    .slice(0, 10)
    .map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

  res.status(200).json(leaderboardEntries);
});

// @desc    Claim reward
// @route   POST /api/users/claim-reward
// @access  Private
const claimReward = asyncHandler(async (req, res) => {
  const { tierLevel } = req.body;

  if (!tierLevel || isNaN(tierLevel)) {
    res.status(400);
    throw new Error('Invalid tier level');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const tiers = [
    {
      level: 1,
      requiredReferrals: 5,
      rewardType: 'badge',
      rewardDescription: 'Exclusive Badge',
      rewardIcon: '🥷',
    },
    {
      level: 2,
      requiredReferrals: 10,
      rewardType: 'cash',
      rewardDescription: '₹100 Cash',
      rewardIcon: '💰',
    },
    {
      level: 3,
      requiredReferrals: 20,
      rewardType: 'premium',
      rewardDescription: 'Premium Features',
      rewardIcon: '👑',
    },
  ];

  const tier = tiers.find((t) => t.level === tierLevel);
  if (!tier) {
    res.status(400);
    throw new Error('Invalid tier level');
  }

  if (user.referralCount < tier.requiredReferrals) {
    res.status(400);
    throw new Error(`You need ${tier.requiredReferrals} referrals to claim this reward`);
  }

  const alreadyClaimed = user.claimedRewards.some((r) => r.tierLevel === tierLevel);
  if (alreadyClaimed) {
    res.status(400);
    throw new Error('This reward has already been claimed');
  }

  let reward = {
    tierLevel,
    rewardType: tier.rewardType,
    rewardDescription: tier.rewardDescription,
    status: tier.rewardType === 'cash' ? 'pending' : 'completed',
    claimedAt: new Date(),
  };

  let razorpayOrder = null;
  if (tier.rewardType === 'cash') {
    // Initialize Razorpay here
    let razorpay = null;
    try {
      console.log('Attempting Razorpay initialization', {
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? 'present' : 'missing',
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing',
      });
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn(
          'Razorpay keys missing. RAZORPAY_KEY_ID:',
          process.env.RAZORPAY_KEY_ID ? 'present' : 'missing',
          'RAZORPAY_KEY_SECRET:',
          process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing'
        );
        throw new Error('Razorpay keys missing');
      }
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      console.log('Razorpay initialized successfully with Key ID:', process.env.RAZORPAY_KEY_ID);
    } catch (error) {
      console.error('Failed to initialize Razorpay:', error.message);
      res.status(500);
      throw new Error('Razorpay is not initialized. Please contact support.');
    }

    try {
      const order = await razorpay.orders.create({
        amount: 10000, // ₹100 in paise
        currency: 'INR',
        receipt: `reward_${user._id}_${tierLevel}`,
        notes: { userId: user._id.toString(), tierLevel },
      });
      reward.paymentDetails = `Razorpay Order: ${order.id}`;
      razorpayOrder = { orderId: order.id, amount: 10000, currency: 'INR' };
    } catch (error) {
      console.error('Razorpay order creation failed:', error.message);
      res.status(500);
      throw new Error('Failed to create Razorpay order. Please try again.');
    }
  }

  user.claimedRewards.push(reward);
  await user.save();

  res.status(200).json({
    success: true,
    message:
      tier.rewardType === 'cash'
        ? 'Proceed to Razorpay to complete your reward payment.'
        : tier.rewardType === 'badge'
        ? 'Badge unlocked and added to your profile!'
        : 'Premium features activated!',
    razorpayOrder,
  });
});

// @desc    Verify payment
// @route   POST /api/users/verify-payment
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing payment details');
  }

  // Initialize Razorpay here
  let razorpay = null;
  try {
    console.log('Attempting Razorpay initialization for verifyPayment', {
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? 'present' : 'missing',
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing',
    });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn(
        'Razorpay keys missing. RAZORPAY_KEY_ID:',
        process.env.RAZORPAY_KEY_ID ? 'present' : 'missing',
        'RAZORPAY_KEY_SECRET:',
        process.env.RAZORPAY_KEY_SECRET ? 'present' : 'missing'
      );
      throw new Error('Razorpay keys missing');
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('Razorpay initialized successfully for verifyPayment with Key ID:', process.env.RAZORPAY_KEY_ID);
  } catch (error) {
    console.error('Failed to initialize Razorpay for verifyPayment:', error.message);
    res.status(500);
    throw new Error('Razorpay is not initialized. Please contact support.');
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  const user = await User.findOne({ 'claimedRewards.paymentDetails': new RegExp(razorpay_order_id) });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const reward = user.claimedRewards.find((r) => r.paymentDetails.includes(razorpay_order_id));
  if (!reward) {
    res.status(400);
    throw new Error('Reward not found for this order');
  }

  reward.status = 'completed';
  await user.save();

  res.status(200).json({ success: true, message: 'Payment verified and reward processed' });
});

// @desc    Recognize a user's identity
// @route   POST /api/users/recognize
// @access  Private
const recognizeUser = asyncHandler(async (req, res) => {
  const { targetUserId, guessedIdentity } = req.body;
  
  if (!targetUserId || !guessedIdentity) {
    res.status(400);
    throw new Error('Please provide both target user ID and guessed identity');
  }

  // Check if target user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error('Target user not found');
  }

  // Prevent self-recognition
  if (targetUser._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot recognize yourself');
  }

  // Get current user
  const currentUser = await User.findById(req.user._id);
  
  // Check if user has already recognized this target
  if (currentUser.recognizedUsers.includes(targetUserId)) {
    res.status(400);
    throw new Error('You have already recognized this user');
  }

  // Check if recognition was previously revoked
  if (currentUser.recognitionRevocations.includes(targetUserId)) {
    res.status(400);
    throw new Error('You cannot re-recognize a user after revoking');
  }

  // Increment recognition attempts
  currentUser.recognitionAttempts += 1;

  // Verify if the guess is correct (matches username)
  const isCorrect = targetUser.username === guessedIdentity.trim();

  if (isCorrect) {
    // Add target to current user's recognized list
    currentUser.recognizedUsers.push(targetUserId);
    currentUser.successfulRecognitions += 1;
    
    // Add current user to target's recognizers list
    targetUser.identityRecognizers.push(req.user._id);
    
    await targetUser.save();
    await currentUser.save();
    
    res.status(200).json({
      success: true,
      message: 'Recognition successful',
      recognitionRate: Math.round((currentUser.successfulRecognitions / currentUser.recognitionAttempts) * 100)
    });
  } else {
    await currentUser.save();
    
    res.status(200).json({
      success: false,
      message: 'Recognition failed. The identity you guessed is incorrect.',
      recognitionRate: Math.round((currentUser.successfulRecognitions / currentUser.recognitionAttempts) * 100)
    });
  }
});

// @desc    Get user's recognitions
// @route   GET /api/users/recognitions
// @access  Private
const getRecognitions = asyncHandler(async (req, res) => {
  const { type = 'all', filter = 'all' } = req.query;
  
  const user = await User.findById(req.user._id)
    .populate('recognizedUsers', 'username anonymousAlias avatarEmoji')
    .populate('identityRecognizers', 'username anonymousAlias avatarEmoji');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let recognized = user.recognizedUsers || [];
  let recognizers = user.identityRecognizers || [];

  // Apply filters
  if (filter === 'mutual') {
    const recognizedIds = recognized.map(r => r._id.toString());
    const recognizerIds = recognizers.map(r => r._id.toString());
    
    recognized = recognized.filter(r => recognizerIds.includes(r._id.toString()));
    recognizers = recognizers.filter(r => recognizedIds.includes(r._id.toString()));
  }
  
  // Calculate recognition rate
  const recognitionRate = user.recognitionAttempts > 0
    ? Math.round((user.successfulRecognitions / user.recognitionAttempts) * 100)
    : 0;
  
  const response = {
    stats: {
      recognitionRate,
      totalRecognized: user.recognizedUsers?.length || 0,
      totalRecognizers: user.identityRecognizers?.length || 0,
      successfulRecognitions: user.successfulRecognitions || 0,
      recognitionAttempts: user.recognitionAttempts || 0
    }
  };
  
  // Return requested data based on type
  if (type === 'all' || type === 'recognized') {
    response.recognized = recognized;
  }
  
  if (type === 'all' || type === 'recognizers') {
    response.recognizers = recognizers;
  }
  
  res.status(200).json(response);
});

// @desc    Revoke a recognition
// @route   POST /api/users/revoke-recognition
// @access  Private
const revokeRecognition = asyncHandler(async (req, res) => {
  const { targetUserId } = req.body;
  
  if (!targetUserId) {
    res.status(400);
    throw new Error('Please provide target user ID');
  }

  // Get current user
  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Check if user has recognized this target
  if (!currentUser.recognizedUsers.includes(targetUserId)) {
    res.status(400);
    throw new Error('You have not recognized this user');
  }
  
  // Get target user
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error('Target user not found');
  }
  
  // Remove target from current user's recognized list
  currentUser.recognizedUsers = currentUser.recognizedUsers.filter(
    id => id.toString() !== targetUserId
  );
  
  // Remove current user from target's recognizers list
  targetUser.identityRecognizers = targetUser.identityRecognizers.filter(
    id => id.toString() !== req.user._id.toString()
  );
  
  // Add to revocation lists to prevent re-recognition
  currentUser.recognitionRevocations.push(targetUserId);
  
  // Decrement successful recognitions
  if (currentUser.successfulRecognitions > 0) {
    currentUser.successfulRecognitions -= 1;
  }
  
  await targetUser.save();
  await currentUser.save();
  
  res.status(200).json({
    success: true,
    message: 'Recognition revoked successfully'
  });
});

// Token generation
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = {
  claimReward,
  registerUser,
  loginUser,
  verifyPayment,
  getUserProfileById,
  updateUserProfile,
  addFriend,
  getOwnPosts,
  processReferral,
  getReferralLeaderboard,
  recognizeUser,
  getRecognitions,
  revokeRecognition,getMyProfile
};
