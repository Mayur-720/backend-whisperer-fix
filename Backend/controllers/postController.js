
const asyncHandler = require('express-async-handler');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const GhostCircle = require('../models/ghostCircleModel');
const mongoose = require('mongoose');
const { log } = require('console');

// @desc    Create a new post (global or in ghost circle)
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  const { content, ghostCircleId, imageUrl, images, videos, expiresIn } = req.body;

  // Check if content, image, or video is provided
  if (!content && !imageUrl && (!images || images.length === 0) && (!videos || videos.length === 0)) {
    res.status(400);
    throw new Error('Please add content, image, or video to your post');
  }

  // Calculate expiry time (default 24 hours)
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + (expiresIn || 24));

  // Prepare the post data
  const postData = {
    user: req.user._id,
    content: content || '',
    imageUrl: imageUrl || '',
    images: images || [],
    videos: videos || [],
    anonymousAlias: req.user.anonymousAlias,
    avatarEmoji: req.user.avatarEmoji,
    expiresAt: expiryTime,
  };

  // Check if the post is for a specific ghost circle
  if (ghostCircleId) {
    // Check if ghost circle exists and user is a member
    const ghostCircle = await GhostCircle.findById(ghostCircleId);

    if (!ghostCircle) {
      res.status(404);
      throw new Error('Ghost circle not found');
    }

    const isMember = ghostCircle.members.some(member => 
      member.userId.toString() === req.user._id.toString()
    );

    if (!isMember) {
      res.status(403);
      throw new Error('Not authorized to post in this ghost circle');
    }

    // Add ghost circle reference to post data
    postData.ghostCircle = ghostCircleId;
  }

  // Create the post
  const post = await Post.create(postData);

  // Add post ID to the user's posts array
  const user = await User.findById(req.user._id);
  user.posts.push(post._id); // Add the new post ID to the user's posts array
  await user.save();

  // If posting to a ghost circle, add post to the circle's posts
  if (ghostCircleId) {
    await GhostCircle.findByIdAndUpdate(
      ghostCircleId,
      { $push: { posts: post._id } }
    );
  }

  // Return the newly created post
  res.status(201).json(post);
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = asyncHandler(async (req, res) => {
  const { content, imageUrl, images, videos } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Check if user is the post author
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this post');
  }

  // Update post fields
  post.content = content !== undefined ? content : post.content;
  post.imageUrl = imageUrl !== undefined ? imageUrl : post.imageUrl;
  post.images = images !== undefined ? images : post.images;
  post.videos = videos !== undefined ? videos : post.videos;

  const updatedPost = await post.save();
  res.json(updatedPost);
});

// @desc    Delete a post
// @route   DELETE /api/posts/delete/:postId
// @access  Private
const deletepost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  // Check if user is the post author
  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this post');
  }

  await Post.findByIdAndDelete(req.params.postId);
  res.json({ message: 'Post deleted successfully' });
});

// @desc    Get global feed posts (not in ghost circles)
// @route   GET /api/posts/global
// @access  Private
const getGlobalFeed = asyncHandler(async (req, res) => {
  const posts = await Post.find({
    ghostCircle: { $exists: false },
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .limit(30);
  
  res.json(posts);
});

// controllers/postController.js
const addComment = asyncHandler(async (req, res) => {
  const { content, anonymousAlias } = req.body;
  
  // Validate input fields
  if (!content || !anonymousAlias) {
    return res.status(400).json({ message: 'Comment content and alias are required' });
  }

  try {
    // Find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Create the new comment object
    const newComment = {
      user: req.user._id, // comes from auth middleware
      content,
      anonymousAlias,
      avatarEmoji: req.user.avatarEmoji || "🎭",
      _id: new mongoose.Types.ObjectId()
    };

    // Add new comment to the beginning of the comments array
    post.comments.unshift(newComment);

    // Save the post with the new comment
    await post.save();

    res.status(201).json({
      message: 'Comment added successfully',
      comment: newComment,
    });
  } catch (err) {
    // Handle server error
    res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
});

// @desc    Edit a comment
// @route   PUT /api/posts/:id/comments/:commentId
// @access  Private
const editComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  // Validate content
  if (!content) {
    res.status(400);
    throw new Error('Comment content is required');
  }
  
  try {
    // Find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    
    // Find the comment by ID
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === req.params.commentId
    );
    
    if (commentIndex === -1) {
      res.status(404);
      throw new Error('Comment not found');
    }
    
    // Check if user is the comment author
    if (post.comments[commentIndex].user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to edit this comment');
    }
    
    // Update the comment content
    post.comments[commentIndex].content = content;
    
    // Save the post with updated comment
    await post.save();
    
    res.json({
      message: 'Comment updated successfully',
      comment: post.comments[commentIndex]
    });
  } catch (error) {
    console.error('Edit comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Delete a comment
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  try {
    // Find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    
    // Find the comment by ID
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === req.params.commentId
    );
    
    if (commentIndex === -1) {
      res.status(404);
      throw new Error('Comment not found');
    }
    
    // Check if user is the comment author or post author
    const isCommentAuthor = post.comments[commentIndex].user.toString() === req.user._id.toString();
    const isPostAuthor = post.user.toString() === req.user._id.toString();
    
    if (!isCommentAuthor && !isPostAuthor) {
      res.status(403);
      throw new Error('Not authorized to delete this comment');
    }
    
    // Remove the comment
    post.comments.splice(commentIndex, 1);
    
    // Save the post
    await post.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reply to a comment
// @route   POST /api/posts/:id/comments/:commentId/reply
// @access  Private
const replyToComment = asyncHandler(async (req, res) => {
  const { content, anonymousAlias } = req.body;
  
  // Validate content and alias
  if (!content || !anonymousAlias) {
    res.status(400);
    throw new Error('Reply content and alias are required');
  }
  
  try {
    // Find the post
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }
    
    // Find the comment to reply to
    const commentIndex = post.comments.findIndex(
      comment => comment._id.toString() === req.params.commentId
    );
    
    if (commentIndex === -1) {
      res.status(404);
      throw new Error('Comment not found');
    }
    
    // Create the reply
    const reply = {
      user: req.user._id,
      content,
      anonymousAlias,
      avatarEmoji: req.user.avatarEmoji || "🎭",
      _id: new mongoose.Types.ObjectId(),
      createdAt: new Date()
    };
    
    // Initialize replies array if it doesn't exist
    if (!post.comments[commentIndex].replies) {
      post.comments[commentIndex].replies = [];
    }
    
    // Add the reply to the comment
    post.comments[commentIndex].replies.push(reply);
    
    // Save the post
    await post.save();
    
    res.status(201).json({
      message: 'Reply added successfully',
      reply
    });
  } catch (error) {
    console.error('Reply to comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const getComments = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  res.json(post.comments);
});

// @desc    Get ghost circle posts
// @route   GET /api/posts/circle/:id
// @access  Private
const getGhostCirclePosts = asyncHandler(async (req, res) => {
  // Check if user is member of the ghost circle
  const ghostCircle = await GhostCircle.findById(req.params.id);
  
  if (!ghostCircle) {
    res.status(404);
    throw new Error('Ghost circle not found');
  }
  
  const isMember = ghostCircle.members.some(member => 
    member.userId.toString() === req.user._id.toString()
  );
  
  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to view posts in this ghost circle');
  }
  
  const posts = await Post.find({
    ghostCircle: req.params.id,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });
  
  res.json(posts);
});

// @desc    Like/unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  
  // Check if post has already been liked by user
  const alreadyLiked = post.likes.some(like => 
    like.user.toString() === req.user._id.toString()
  );
  
  if (alreadyLiked) {
    // Remove like
    post.likes = post.likes.filter(like => 
      like.user.toString() !== req.user._id.toString()
    );
  } else {
    // Add like
    post.likes.push({ 
      user: req.user._id, 
      anonymousAlias: req.user.anonymousAlias 
    });
    
    // Extend post life by 1 hour
    if (post.expiresAt > new Date()) {
      post.expiresAt = new Date(post.expiresAt.getTime() + 60 * 60 * 1000);
    }
  }
  
  await post.save();
  
  res.json({ likes: post.likes.length, expiresAt: post.expiresAt });
});

// @desc    Try to recognize post author
// @route   POST /api/posts/:id/recognize
// @access  Private
const recognizeUser = asyncHandler(async (req, res) => {
  const { guessUsername } = req.body;
  
  if (!guessUsername) {
    res.status(400);
    throw new Error('Please provide a username guess');
  }
  
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }
  
  // Find the guessed user
  const guessedUser = await User.findOne({ username: guessUsername });
  
  if (!guessedUser) {
    return res.status(200).json({ 
      correct: false, 
      message: 'No user found with that username' 
    });
  }
  
  // Check if guess is correct
  const isCorrect = post.user.toString() === guessedUser._id.toString();
  
  if (isCorrect) {
    // Check if already recognized
    const alreadyRecognized = req.user.recognizedUsers.some(ru => 
      ru.userId.toString() === post.user.toString()
    );
    
    if (!alreadyRecognized) {
      // Add to recognized users
      await User.findByIdAndUpdate(
        req.user._id,
        { 
          $push: { 
            recognizedUsers: { 
              userId: post.user, 
              recognizedAt: new Date() 
            } 
          } 
        }
      );
      
      // Add to identity recognizers of the post author
      await User.findByIdAndUpdate(
        post.user,
        { 
          $push: { 
            identityRecognizers: { 
              userId: req.user._id, 
              recognizedAt: new Date() 
            } 
          } 
        }
      );
    }
    
    return res.json({ 
      correct: true, 
      message: 'Correct! You recognized the user.',
      user: {
        _id: guessedUser._id,
        username: guessedUser.username,
        avatarEmoji: guessedUser.avatarEmoji
      }
    });
  } else {
    return res.json({ 
      correct: false, 
      message: 'Incorrect guess. Try again!' 
    });
  }
});

const incrementShareCount = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  post.shareCount += 1; // Increment share count
  await post.save();

  res.status(200).json({ shareCount: post.shareCount });
});

const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('user', 'anonymousAlias avatarEmoji username')
    .populate('comments.user', 'anonymousAlias avatarEmoji');

  if (!post) {
    res.status(404);
    throw new Error('Post not found');
  }

  res.json(post);
});

module.exports = {
  createPost,
  updatePost,
  deletepost,
  getGlobalFeed,
  getGhostCirclePosts,
  getPostById,
  likePost,
  recognizeUser,
  getComments,
  addComment,
  editComment,
  incrementShareCount,
  deleteComment,
  replyToComment
};
