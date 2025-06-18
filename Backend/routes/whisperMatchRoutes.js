
const express = require("express");
const { joinWhisperMatch, sendWhisperMatchMessage, leaveWhisperMatch } = require("../controllers/whisperMatchController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/join", protect, joinWhisperMatch);
router.post("/message", protect, sendWhisperMatchMessage);
router.post("/leave", protect, leaveWhisperMatch);

module.exports = router;
