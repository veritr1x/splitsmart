const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

// Register a new user
exports.register = (req, res) => {
  const { username, email, password, fullName } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email and password' });
  }

  // Check if user already exists
  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Server error' });
    }

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert user into database
      db.run(
        'INSERT INTO users (username, email, password, fullName) VALUES (?, ?, ?, ?)',
        [username, email, hashedPassword, fullName || ''],
        function (err) {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }

          // Get the newly created user
          db.get('SELECT id, username, email, fullName FROM users WHERE id = ?', [this.lastID], (err, user) => {
            if (err) {
              console.error(err.message);
              return res.status(500).json({ message: 'Server error' });
            }

            // Create JWT token
            const token = jwt.sign(
              { user: { id: user.id } },
              process.env.JWT_SECRET || 'splitsmartjwtsecret',
              { expiresIn: '7d' }
            );

            res.json({
              token,
              user
            });
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  });
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  // Check if user exists
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    try {
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Create JWT token
      const token = jwt.sign(
        { user: { id: user.id } },
        process.env.JWT_SECRET || 'splitsmartjwtsecret',
        { expiresIn: '7d' }
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  });
};

// Get current user
exports.getCurrentUser = (req, res) => {
  res.json(req.user);
}; 