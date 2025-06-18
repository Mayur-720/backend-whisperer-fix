
const mongoose = require("mongoose");

const promptEventSchema = new mongoose.Schema(
  {
    promptText: {
      type: String,
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PromptEvent", promptEventSchema);

