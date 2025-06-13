
const jwt = require('jsonwebtoken');

// Cache for JWT secrets to avoid repeated process.env access
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables');
}

const generateToken = (id, expiresIn = JWT_EXPIRES_IN) => {
  try {
    return jwt.sign({ id }, JWT_SECRET, { 
      expiresIn,
      algorithm: 'HS256' // Explicitly specify algorithm for security
    });
  } catch (error) {
    console.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (error) {
    console.error('Token verification error:', error);
    
    // Return specific error types for better handling
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

const decodeToken = (token) => {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
};

// Get token expiry time
const getTokenExpiry = (token) => {
  try {
    const decoded = jwt.decode(token);
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
  } catch (error) {
    console.error('Token expiry check error:', error);
    return null;
  }
};

// Check if token is about to expire (within next hour)
const isTokenNearExpiry = (token, bufferMinutes = 60) => {
  try {
    const expiry = getTokenExpiry(token);
    if (!expiry) return true;
    
    const now = new Date();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds
    
    return (expiry.getTime() - now.getTime()) < bufferTime;
  } catch (error) {
    console.error('Token expiry check error:', error);
    return true; // Consider expired if we can't check
  }
};

module.exports = { 
  generateToken, 
  verifyToken, 
  decodeToken, 
  getTokenExpiry, 
  isTokenNearExpiry 
};
