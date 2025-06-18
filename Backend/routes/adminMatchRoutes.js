
const express = require("express");
const router = express.Router();
const { getMatchStats } = require("../controllers/adminMatchController");
const { protect } = require("../middleware/authMiddleware");

// Only admin should be able to access these routes!

router.get("/match-stats", protect, getMatchStats);

module.exports = router;
