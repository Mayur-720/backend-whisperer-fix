
// const jwt = require('jsonwebtoken');
// const asyncHandler = require('express-async-handler');
// const User = require('../models/userModel');
// const { verifyToken } = require('../utils/jwtHelper');

// const protect = asyncHandler(async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     try {
//       // Get token from header
//       token = req.headers.authorization.split(' ')[1];

//       // Verify token
//       const decoded = verifyToken(token);

//       if (!decoded) {
//         res.status(401);
//         throw new Error('Not authorized, token failed');
//       }

//       // Get user from the token
//       req.user = await User.findById(decoded.id).select('-password');

//       if (!req.user) {
//         res.status(401);
//         throw new Error('User not found');
//       }

//       next();
//     } catch (error) {
//       console.error(error);
//       res.status(401);
//       throw new Error('Not authorized, token failed');
//     }
//   }

//   if (!token) {
//     res.status(401);
//     throw new Error('Not authorized, no token');
//   }
// });

// module.exports = { protect };
// Backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error.message);
      if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Token expired, please log in again');
      }
      res.status(401);
      throw new Error('Not authorized, invalid token');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.id)
      .select('-password')
      .then((user) => {
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }
        socket.user = user;
        next();
      })
      .catch(() => next(new Error('Authentication error: Invalid token')));
  } catch (error) {
    return next(new Error('Authentication error: Token verification failed'));
  }
};

module.exports = { protect,socketAuth };