
const mongoose = require('mongoose');

// Define a comment schema to be reused in both comments and replies
const commentSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  anonymousAlias: {
    type: String,
    required: true,
  },
  avatarEmoji: {
    type: String,
    default: '🎭',
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  replies: [
    {
      type: mongoose.Schema.Types.Mixed, // Will recursively use the same schema
      default: [],
    }
  ]
});

const postSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    images: [{
      type: String,
      default: [],
    }],
    videos: [{
      url: {
        type: String,
        required: true
      },
      thumbnail: {
        type: String,
        default: ''
      },
      duration: {
        type: Number,
        default: 0
      },
      size: {
        type: Number,
        default: 0
      }
    }],
    anonymousAlias: {
      type: String,
      required: true,
    },
    avatarEmoji: {
      type: String,
      required: true,
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        anonymousAlias: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    comments: [commentSchema],
    ghostCircle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GhostCircle',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    shareCount: {
      type: Number,
      default: 0, // Initialize to 0 for new posts
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);
