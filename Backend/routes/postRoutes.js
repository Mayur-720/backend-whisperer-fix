
const express = require('express');
const router = express.Router();
const {
  createPost,
  getGlobalFeed,
  getGhostCirclePosts,
  likePost,
  addComment,
  getComments,
  deletepost,
  recognizeUser,
  updatePost,
  editComment,
  deleteComment,
  replyToComment,
  getPostById,
  incrementShareCount,
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Protected routes
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/delete/:postId', protect, deletepost);
router.get('/global', protect, getGlobalFeed);
router.get('/circle/:id', protect, getGhostCirclePosts);
router.put('/:id/like', protect, likePost);
router.get('/:id', getPostById);
router.put('/:postId/share', protect, incrementShareCount); 
router.post('/:id/recognize', protect, recognizeUser);

// Comment routes
router.post('/:id/comments', protect, addComment);
router.get('/:id/comments', protect, getComments);
router.put('/:id/comments/:commentId', protect, editComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/comments/:commentId/reply', protect, replyToComment);

module.exports = router;
