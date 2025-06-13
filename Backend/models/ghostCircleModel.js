const mongoose = require('mongoose');

const ghostCircleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        isAnonymous: {
          type: Boolean,
          default: true,
        },
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ghostCircleSchema.virtual('members.userDetails', {
  ref: 'User',
  localField: 'members.userId',
  foreignField: '_id',
  justOne: false,
  options: { select: 'anonymousAlias' },
});

module.exports = mongoose.model('GhostCircle', ghostCircleSchema);