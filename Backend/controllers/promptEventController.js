
// controllers/promptEventController.js
const asyncHandler = require("express-async-handler");
const PromptEvent = require("../models/promptEventModel");

const getCurrentWeekNumber = () => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const pastDaysOfYear = (now - startOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

// GET /api/prompts/current - Get current week's active prompt
const getCurrentPrompt = asyncHandler(async (_req, res) => {
  const week = getCurrentWeekNumber();
  // First, try to find the ACTIVE prompt for this week
  let prompt = await PromptEvent.findOne({ weekNumber: week, active: true });

  if (!prompt) {
    // If no active prompt, fallback: find any prompt for week (even if inactive)
    prompt = await PromptEvent.findOne({ weekNumber: week });
  }
  if (!prompt) {
    // Fallback: create default prompt for this week if none exists at all
    prompt = await PromptEvent.create({
      promptText: "Share your most mysterious moment.",
      weekNumber: week,
      active: true,
    });
  }
  res.json({
    promptText: prompt.promptText,
    weekNumber: prompt.weekNumber,
    active: prompt.active,
    _id: prompt._id,
  });
});

// POST /api/prompts - Admin creates/sets this week's prompt
const setWeeklyPrompt = asyncHandler(async (req, res) => {
  const { promptText } = req.body;
  const week = getCurrentWeekNumber();

  // Deactivate all old prompts (including old for this week)
  await PromptEvent.updateMany({ weekNumber: week }, { active: false });
  // Save new active prompt for this week
  const prompt = await PromptEvent.create({
    promptText,
    weekNumber: week,
    active: true,
    createdBy: req.user?._id,
  });

  res.status(201).json(prompt);
});

module.exports = {
  getCurrentPrompt,
  setWeeklyPrompt,
};

