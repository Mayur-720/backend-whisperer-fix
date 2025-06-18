
const express = require("express");
const { getCurrentPrompt, setWeeklyPrompt } = require("../controllers/promptEventController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/current", protect, getCurrentPrompt);
router.post("/", protect, setWeeklyPrompt); // You may add admin check for posting

module.exports = router;
