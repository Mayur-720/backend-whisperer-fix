
const express = require("express");
const { getActiveAMAs, startAMA, askQuestion, answerQuestion } = require("../controllers/amaController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getActiveAMAs);
router.post("/start", protect, startAMA);
router.post("/ask", protect, askQuestion);
router.post("/answer", protect, answerQuestion);

module.exports = router;
