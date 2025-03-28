const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all expense routes
router.use(authMiddleware);

// Get all expenses for a group
router.get('/group/:groupId', expenseController.getExpensesByGroup);

// Get all expenses between current user and another user
router.get('/user/:userId', expenseController.getExpensesBetweenUsers);

// Create new expense
router.post('/', expenseController.createExpense);

// Get expense details
router.get('/:expenseId', expenseController.getExpenseById);

// Update expense
router.put('/:expenseId', expenseController.updateExpense);

// Delete expense
router.delete('/:expenseId', expenseController.deleteExpense);

// Settle up between users in a group
router.post('/settle', expenseController.settleExpenses);

// Settle up directly between users (without group)
router.post('/settle/direct', expenseController.settleDirectExpenses);

module.exports = router; 