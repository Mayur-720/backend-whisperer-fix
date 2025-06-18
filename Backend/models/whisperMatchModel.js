
const mongoose = require("mongoose");

const whisperMatchSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    active: { type: Boolean, default: true },
    matchedAt: { type: Date },
    sessionExpiresAt: { type: Date },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        content: String,
        sentAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhisperMatch", whisperMatchSchema);
