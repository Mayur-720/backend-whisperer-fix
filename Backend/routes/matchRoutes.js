
// routes/matchRoutes.js
const express = require("express");
const router = express.Router();
const { getMatches, unlockPremiumMatches } = require("../controllers/matchController");
const { protect } = require("../middleware/authMiddleware");

// Get matches for the logged-in user
router.get("/", protect, getMatches);
// Unlock premium matches after payment
router.post("/unlock", protect, unlockPremiumMatches);

module.exports = router;
