
// controllers/adminMatchController.js (WIP stub)
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// GET /api/admin/match-stats - view aggregated match stats, top interests, revenue, etc.
const getMatchStats = asyncHandler(async (_req, res) => {
  // Example placeholder
  const totalPremiumUnlocks = await User.countDocuments({ premiumMatchUnlocks: { $gt: 0 } });
  res.json({ totalPremiumUnlocks });
});

module.exports = { getMatchStats };
