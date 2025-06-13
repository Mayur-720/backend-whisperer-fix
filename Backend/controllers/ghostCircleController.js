const asyncHandler = require('express-async-handler');
const GhostCircle = require('../models/ghostCircleModel');
const User = require('../models/userModel');

// @desc    Create a new ghost circle
// @route   POST /api/ghost-circles
// @access  Private
const createGhostCircle = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a name for the ghost circle');
  }

  const ghostCircle = await GhostCircle.create({
    name,
    description: description || '',
    creator: req.user._id,
    members: [{ userId: req.user._id, joinedAt: new Date() }]
  });

  await User.findByIdAndUpdate(
    req.user._id,
    { $push: { ghostCircles: ghostCircle._id } }
  );

  res.status(201).json(ghostCircle);
});

// @desc    Get all ghost circles for current user
// @route   GET /api/ghost-circles
// @access  Private
const getMyGhostCircles = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'ghostCircles',
    populate: {
      path: 'members.userDetails',
      select: 'anonymousAlias',
    },
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const ghostCirclesWithAliases = user.ghostCircles.map(circle => {
    const membersWithAliases = circle.members.map(member => {
      const userData = member.userDetails && member.userDetails.length > 0 ? member.userDetails[0] : {};
      // Destructure member and exclude userDetails, then add anonymousAlias
      const { userDetails, ...memberWithoutDetails } = member.toObject();
      return {
        ...memberWithoutDetails,
        anonymousAlias: userData.anonymousAlias || 'Anonymous',
      };
    });
    return {
      ...circle.toObject(),
      members: membersWithAliases,
    };
  });

  res.json(ghostCirclesWithAliases);
});

// @desc    Invite a user to a ghost circle
// @route   POST /api/ghost-circles/:id/invite
// @access  Private
const inviteToGhostCircle = asyncHandler(async (req, res) => {
  const { friendUsername } = req.body;

  if (!friendUsername) {
    res.status(400);
    throw new Error('Please provide a friend username');
  }

  const ghostCircle = await GhostCircle.findById(req.params.id);

  if (!ghostCircle) {
    res.status(404);
    throw new Error('Ghost circle not found');
  }

  if (ghostCircle.creator.toString() !== req.user._id.toString() && 
      !ghostCircle.admins.includes(req.user._id)) {
    res.status(403);
    throw new Error('Not authorized to invite to this circle');
  }

  const friend = await User.findOne({ username: friendUsername });

  if (!friend) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMember = ghostCircle.members.some(member => 
    member.userId.toString() === friend._id.toString()
  );

  if (isMember) {
    res.status(400);
    throw new Error('User is already a member of this ghost circle');
  }

  ghostCircle.members.push({ userId: friend._id, joinedAt: new Date() });
  await ghostCircle.save();

  await User.findByIdAndUpdate(
    friend._id,
    { $push: { ghostCircles: ghostCircle._id } }
  );

  res.status(200).json({ message: 'User invited to ghost circle successfully' });
});

// @desc    Get a specific ghost circle by ID
// @route   GET /api/ghost-circles/:id
// @access  Private
const getGhostCircleById = asyncHandler(async (req, res) => {
  const ghostCircle = await GhostCircle.findById(req.params.id).populate({
    path: 'members.userDetails',
    select: 'anonymousAlias',
  });

  if (!ghostCircle) {
    res.status(404);
    throw new Error('Ghost circle not found');
  }

  const isMember = ghostCircle.members.some(member => 
    member.userId.toString() === req.user._id.toString()
  );

  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to view this ghost circle');
  }

  const membersWithAliases = ghostCircle.members.map(member => {
    const userDetails = member.userDetails && member.userDetails.length > 0 ? member.userDetails[0] : {};
    return {
      ...member.toObject(),
      anonymousAlias: userDetails.anonymousAlias || 'Anonymous',
    };
  });

  res.json({
    ...ghostCircle.toObject(),
    members: membersWithAliases,
  });
});

// @desc    Search for users to invite to a ghost circle
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 1) {
    return res.json([]);
  }

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { anonymousAlias: { $regex: q, $options: 'i' } }
    ]
  })
  .select('_id username avatarEmoji anonymousAlias')
  .limit(10);

  res.json(users);
});

module.exports = {
  createGhostCircle,
  getMyGhostCircles,
  inviteToGhostCircle,
  getGhostCircleById,
  searchUsers,
};