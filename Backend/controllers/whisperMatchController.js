
// controllers/whisperMatchController.js
const asyncHandler = require("express-async-handler");
const WhisperMatch = require("../models/whisperMatchModel");
const User = require("../models/userModel");

// In-memory queue for demo, use Redis or similar for scaling
let queue = [];

// POST /api/whisper-match/join -- Add user to queue or match
const joinWhisperMatch = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  // Prevent double queuing or match
  if (queue.includes(userId)) {
    return res.status(200).json({ status: "waiting" });
  }
  // Check if in any active match
  const existing = await WhisperMatch.findOne({ $or: [{userA: userId}, {userB: userId}], active: true });
  if (existing) {
    return res.json({ status: "matched", match: existing });
  }

  if (queue.length > 0) {
    const partnerId = queue.shift();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    const match = await WhisperMatch.create({
      userA: userId,
      userB: partnerId,
      matchedAt: new Date(),
      sessionExpiresAt: expires,
      active: true,
    });
    return res.json({ status: "matched", match });
  }
  queue.push(userId);
  res.json({ status: "waiting" });
});

// POST /api/whisper-match/message
const sendWhisperMatchMessage = asyncHandler(async (req, res) => {
  const { matchId, content } = req.body;
  const match = await WhisperMatch.findById(matchId);
  if (!match || !match.active) {
    return res.status(400).json({ message: "No active match." });
  }
  match.messages.push({ sender: req.user._id, content });
  await match.save();

  // Optionally: emit socket event to other user

  res.json({ message: "Message sent" });
});

// POST /api/whisper-match/leave
const leaveWhisperMatch = asyncHandler(async (req, res) => {
  const { matchId } = req.body;
  const match = await WhisperMatch.findById(matchId);
  if (match) {
    match.active = false;
    await match.save();
  }
  queue = queue.filter((id) => id !== req.user._id.toString());
  res.json({ message: "Left match" });
});

module.exports = { joinWhisperMatch, sendWhisperMatchMessage, leaveWhisperMatch };
