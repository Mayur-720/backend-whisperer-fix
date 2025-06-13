
const mongoose = require('mongoose');

const whisperSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    senderAlias: {
      type: String,
      required: true,
    },
    senderEmoji: {
      type: String,
      required: true,
    },
    // Visibility level increases as conversation continues
    visibilityLevel: {
      type: Number,
      default: 0, // 0: anonymous, 1: partial clues, 2: more clues, 3: full identity
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Whisper', whisperSchema);
