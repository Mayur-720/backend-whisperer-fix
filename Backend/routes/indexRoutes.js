
const express = require('express');
const router = express.Router();

// Route welcome message
router.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Undercover API',
    version: '1.0.0'
  });
});

module.exports = router;
