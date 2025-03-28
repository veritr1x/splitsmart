const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all user routes
router.use(authMiddleware);

// Get current user profile
router.get('/me', userController.getCurrentUser);

// Get all users
router.get('/', userController.getAllUsers);

// Search users by username or email
router.get('/search', userController.searchUsers);

// Get user's friends
router.get('/friends', userController.getUserFriends);

// Get user's friend balances
router.get('/friends/balances', userController.getFriendBalances);

// Find user by email
router.get('/find-by-email', userController.findUserByEmail);

// Add friend
router.post('/friends', userController.addFriend);

// Remove friend
router.delete('/friends/:friendId', userController.removeFriend);

// Get user's groups
router.get('/groups', userController.getUserGroups);

// Create a new group
router.post('/groups', userController.createGroup);

// Get members of a group
router.get('/group/:groupId/members', userController.getGroupMembers);

// Add user to group
router.post('/groups/:groupId/members', userController.addUserToGroup);

// Update user profile
router.put('/me', userController.updateUserProfile);

// Get user by ID - this must come after the specific routes above
router.get('/:userId', userController.getUserById);

module.exports = router; 