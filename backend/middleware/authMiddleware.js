const jwt = require('jsonwebtoken');
const db = require('../db/database');

module.exports = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'splitsmartjwtsecret');

    // Get user from token
    db.get('SELECT id, username, email, fullName FROM users WHERE id = ?', [decoded.user.id], (err, user) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      // Set user in request
      req.user = user;
      next();
    });
  } catch (err) {
    console.error('Token validation error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 