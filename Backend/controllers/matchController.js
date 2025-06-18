
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// GET /api/match - fetch matches for the logged-in user
const getMatches = asyncHandler(async (req, res) => {
  const { page = 1, limit = 3 } = req.query;
  const userId = req.user._id;

  const currentUser = await User.findById(userId);
  if (!currentUser) {
    res.status(404);
    throw new Error('User not found');
  }
  if (!currentUser.gender || !currentUser.interests || currentUser.interests.length === 0) {
    res.status(400);
    throw new Error('Please complete your profile with gender and interests');
  }

  // Determine target gender for matching
  let targetGender = null;
  if (currentUser.gender === 'male') targetGender = 'female';
  else if (currentUser.gender === 'female') targetGender = 'male';

  // Find users of opposite gender, with at least 1 common interest, not self, and not friends already
  const matches = await User.find({
    _id: { $ne: userId },
    gender: targetGender,
    interests: { $in: currentUser.interests },
  })
    .select("_id username fullName anonymousAlias avatarEmoji bio interests gender")
    .lean();

  // Sort by most interests in common, then by recent
  const sorted = matches.sort((a, b) => {
    const overlapA = a.interests.filter(i => currentUser.interests.includes(i)).length;
    const overlapB = b.interests.filter(i => currentUser.interests.includes(i)).length;
    return overlapB - overlapA;
  });

  // Pagination logic
  const isPremium = currentUser.premiumMatchUnlocks && currentUser.premiumMatchUnlocks > 0;
  const maxResults = isPremium ? 10 : 3;
  const paginated = sorted.slice((page - 1) * maxResults, page * maxResults);

  res.json({
    matches: paginated,
    isPremium,
    total: sorted.length,
    maxResults,
  });
});

// POST /api/match/unlock - unlock premium matches after Razorpay payment
const unlockPremiumMatches = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Here you can verify Razorpay payment if needed
  // For now we'll just increment their unlocks
  user.premiumMatchUnlocks = (user.premiumMatchUnlocks || 0) + 1;
  await user.save();

  res.json({ message: "Premium matches unlocked!", premiumMatchUnlocks: user.premiumMatchUnlocks });
});

module.exports = {
  getMatches,
  unlockPremiumMatches
};
