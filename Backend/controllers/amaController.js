
// controllers/amaController.js
const asyncHandler = require("express-async-handler");
const AmaSession = require("../models/amaModel");

// GET all active AMA sessions
const getActiveAMAs = asyncHandler(async (_req, res) => {
  const amas = await AmaSession.find({ active: true }).populate("host", "username anonymousAlias avatarEmoji");
  res.json(amas);
});
// POST start AMA
const startAMA = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const ama = await AmaSession.create({ host: req.user._id, active: true, title });
  res.status(201).json(ama);
});
// POST question
const askQuestion = asyncHandler(async (req, res) => {
  const { sessionId, text } = req.body;
  const ama = await AmaSession.findById(sessionId);
  if (!ama) return res.status(404).json({ message: "Session not found" });
  ama.questions.push({ text, authorId: req.user._id });
  await ama.save();
  res.json({ message: "Question submitted" });
});
// POST answer
const answerQuestion = asyncHandler(async (req, res) => {
  const { sessionId, qIdx, answer } = req.body;
  const ama = await AmaSession.findById(sessionId);
  if (!ama) return res.status(404).json({ message: "Session not found" });
  if (!ama.host.equals(req.user._id)) return res.status(403).json({ message: "Not host." });
  ama.questions[qIdx].answer = answer;
  ama.questions[qIdx].answered = true;
  await ama.save();
  res.json({ message: "Answered" });
});

module.exports = { getActiveAMAs, startAMA, askQuestion, answerQuestion };

