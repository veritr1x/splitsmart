const db = require('../db/database');

// Get all expenses for a group
exports.getExpensesByGroup = (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  // Check if user is member of the group
  db.get(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, userId],
    (err, member) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!member) {
        return res.status(403).json({ message: 'Not authorized to view this group' });
      }

      // Get expenses for the group
      db.all(
        `SELECT e.*, u.username as payer_name 
         FROM expenses e
         JOIN users u ON e.paid_by = u.id
         WHERE e.group_id = ?
         ORDER BY e.date DESC`,
        [groupId],
        (err, expenses) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }

          // Get expense shares for each expense
          const promises = expenses.map(expense => {
            return new Promise((resolve, reject) => {
              db.all(
                `SELECT es.*, u.username 
                 FROM expense_shares es
                 JOIN users u ON es.user_id = u.id
                 WHERE es.expense_id = ?`,
                [expense.id],
                (err, shares) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  expense.shares = shares;
                  resolve(expense);
                }
              );
            });
          });

          Promise.all(promises)
            .then(expensesWithShares => {
              res.json(expensesWithShares);
            })
            .catch(err => {
              console.error(err.message);
              res.status(500).json({ message: 'Server error' });
            });
        }
      );
    }
  );
};

// Create new expense
exports.createExpense = (req, res) => {
  const { groupId, amount, description, shares } = req.body;
  const paidBy = req.user.id;

  if (!amount || !description || !shares || !Array.isArray(shares)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Check if total shares equals total amount
  const totalShares = shares.reduce((sum, share) => sum + parseFloat(share.amount), 0);
  if (Math.abs(totalShares - parseFloat(amount)) > 0.01) {
    return res.status(400).json({ message: 'Total shares must equal total amount' });
  }

  // Begin transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Insert expense
    db.run(
      'INSERT INTO expenses (group_id, paid_by, amount, description) VALUES (?, ?, ?, ?)',
      [groupId || null, paidBy, amount, description],
      function (err) {
        if (err) {
          console.error(err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Server error' });
        }

        const expenseId = this.lastID;
        const sharePromises = shares.map(share => {
          return new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO expense_shares (expense_id, user_id, amount) VALUES (?, ?, ?)',
              [expenseId, share.userId, share.amount],
              function (err) {
                if (err) {
                  reject(err);
                  return;
                }
                resolve();
              }
            );
          });
        });

        Promise.all(sharePromises)
          .then(() => {
            db.run('COMMIT');
            res.json({ id: expenseId, message: 'Expense created successfully' });
          })
          .catch(err => {
            console.error(err.message);
            db.run('ROLLBACK');
            res.status(500).json({ message: 'Server error' });
          });
      }
    );
  });
};

// Get expense by ID
exports.getExpenseById = (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user.id;

  db.get(
    `SELECT e.*, u.username as payer_name
     FROM expenses e
     JOIN users u ON e.paid_by = u.id
     LEFT JOIN groups g ON e.group_id = g.id
     WHERE e.id = ?`,
    [expenseId],
    (err, expense) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!expense) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      // For direct expenses (no group)
      if (!expense.group_id) {
        // Check if user is involved in this expense
        db.get(
          `SELECT 1 FROM expense_shares 
           WHERE expense_id = ? AND user_id = ?
           UNION
           SELECT 1 FROM expenses
           WHERE id = ? AND paid_by = ?`,
          [expenseId, userId, expenseId, userId],
          (err, involved) => {
            if (err) {
              console.error(err.message);
              return res.status(500).json({ message: 'Server error' });
            }
            
            if (!involved) {
              return res.status(403).json({ message: 'Not authorized to view this expense' });
            }
            
            // Get expense shares
            db.all(
              `SELECT es.*, u.username 
               FROM expense_shares es
               JOIN users u ON es.user_id = u.id
               WHERE es.expense_id = ?`,
              [expenseId],
              (err, shares) => {
                if (err) {
                  console.error(err.message);
                  return res.status(500).json({ message: 'Server error' });
                }

                expense.shares = shares;
                expense.group_name = null;
                res.json(expense);
              }
            );
          }
        );
        return;
      }

      // For group expenses
      // Check if user is member of the group
      db.get(
        'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
        [expense.group_id, userId],
        (err, member) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }

          if (!member) {
            return res.status(403).json({ message: 'Not authorized to view this expense' });
          }

          // Get expense shares
          db.all(
            `SELECT es.*, u.username 
             FROM expense_shares es
             JOIN users u ON es.user_id = u.id
             WHERE es.expense_id = ?`,
            [expenseId],
            (err, shares) => {
              if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Server error' });
              }

              // Add group name
              db.get(
                'SELECT name FROM groups WHERE id = ?',
                [expense.group_id],
                (err, group) => {
                  if (err) {
                    console.error(err.message);
                    return res.status(500).json({ message: 'Server error' });
                  }

                  expense.shares = shares;
                  expense.group_name = group ? group.name : null;
                  res.json(expense);
                }
              );
            }
          );
        }
      );
    }
  );
};

// Update expense
exports.updateExpense = (req, res) => {
  const { expenseId } = req.params;
  const { amount, description, shares } = req.body;
  const userId = req.user.id;

  // Check if user is the one who paid the expense
  db.get('SELECT * FROM expenses WHERE id = ?', [expenseId], (err, expense) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.paid_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this expense' });
    }

    // Begin transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Update expense
      db.run(
        'UPDATE expenses SET amount = ?, description = ? WHERE id = ?',
        [amount || expense.amount, description || expense.description, expenseId],
        err => {
          if (err) {
            console.error(err.message);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Server error' });
          }

          // Update shares if provided
          if (shares && Array.isArray(shares)) {
            // Delete existing shares
            db.run('DELETE FROM expense_shares WHERE expense_id = ?', [expenseId], err => {
              if (err) {
                console.error(err.message);
                db.run('ROLLBACK');
                return res.status(500).json({ message: 'Server error' });
              }

              // Insert new shares
              const sharePromises = shares.map(share => {
                return new Promise((resolve, reject) => {
                  db.run(
                    'INSERT INTO expense_shares (expense_id, user_id, amount) VALUES (?, ?, ?)',
                    [expenseId, share.userId, share.amount],
                    function (err) {
                      if (err) {
                        reject(err);
                        return;
                      }
                      resolve();
                    }
                  );
                });
              });

              Promise.all(sharePromises)
                .then(() => {
                  db.run('COMMIT');
                  res.json({ message: 'Expense updated successfully' });
                })
                .catch(err => {
                  console.error(err.message);
                  db.run('ROLLBACK');
                  res.status(500).json({ message: 'Server error' });
                });
            });
          } else {
            db.run('COMMIT');
            res.json({ message: 'Expense updated successfully' });
          }
        }
      );
    });
  });
};

// Delete expense
exports.deleteExpense = (req, res) => {
  const { expenseId } = req.params;
  const userId = req.user.id;

  // Check if user is the one who paid the expense
  db.get('SELECT * FROM expenses WHERE id = ?', [expenseId], (err, expense) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ message: 'Server error' });
    }

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (expense.paid_by !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }

    // Begin transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Delete expense shares
      db.run('DELETE FROM expense_shares WHERE expense_id = ?', [expenseId], err => {
        if (err) {
          console.error(err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Server error' });
        }

        // Delete expense
        db.run('DELETE FROM expenses WHERE id = ?', [expenseId], err => {
          if (err) {
            console.error(err.message);
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Server error' });
          }

          db.run('COMMIT');
          res.json({ message: 'Expense deleted successfully' });
        });
      });
    });
  });
};

// Settle expenses between users in a group
exports.settleExpenses = (req, res) => {
  const { groupId, toUserId, amount } = req.body;
  const fromUserId = req.user.id;

  if (!groupId || !toUserId || !amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Check if both users are members of the group
  db.all(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id IN (?, ?)',
    [groupId, fromUserId, toUserId],
    (err, members) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      if (members.length !== 2) {
        return res.status(403).json({ message: 'Both users must be members of the group' });
      }

      // Create settlement record
      db.run(
        'INSERT INTO settlements (group_id, from_user_id, to_user_id, amount) VALUES (?, ?, ?, ?)',
        [groupId, fromUserId, toUserId, amount],
        function (err) {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }

          // Update expense shares as settled
          db.all(
            `SELECT es.id FROM expense_shares es
             JOIN expenses e ON es.expense_id = e.id
             WHERE e.group_id = ? AND es.user_id = ? AND e.paid_by = ? AND es.is_settled = 0`,
            [groupId, fromUserId, toUserId],
            (err, shares) => {
              if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Server error' });
              }

              if (shares.length > 0) {
                const shareIds = shares.map(share => share.id).join(',');
                db.run(
                  `UPDATE expense_shares SET is_settled = 1 WHERE id IN (${shareIds})`,
                  err => {
                    if (err) {
                      console.error(err.message);
                      return res.status(500).json({ message: 'Server error' });
                    }

                    res.json({ message: 'Settlement recorded successfully' });
                  }
                );
              } else {
                res.json({ message: 'Settlement recorded successfully' });
              }
            }
          );
        }
      );
    }
  );
};

// Get expenses between users (no group)
exports.getExpensesBetweenUsers = (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  // Get expenses where the current user and the specified user are involved
  db.all(
    `SELECT e.*, u.username as payer_name 
     FROM expenses e
     JOIN users u ON e.paid_by = u.id
     JOIN expense_shares es ON e.id = es.expense_id
     WHERE e.group_id IS NULL
     AND (
       (e.paid_by = ? AND es.user_id = ?)
       OR
       (e.paid_by = ? AND es.user_id = ?)
     )
     GROUP BY e.id
     ORDER BY e.date DESC`,
    [currentUserId, userId, userId, currentUserId],
    (err, expenses) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      // Get expense shares for each expense
      const promises = expenses.map(expense => {
        return new Promise((resolve, reject) => {
          db.all(
            `SELECT es.*, u.username 
             FROM expense_shares es
             JOIN users u ON es.user_id = u.id
             WHERE es.expense_id = ?`,
            [expense.id],
            (err, shares) => {
              if (err) {
                reject(err);
                return;
              }
              expense.shares = shares;
              resolve(expense);
            }
          );
        });
      });

      Promise.all(promises)
        .then(expensesWithShares => {
          res.json(expensesWithShares);
        })
        .catch(err => {
          console.error(err.message);
          res.status(500).json({ message: 'Server error' });
        });
    }
  );
};

// Settle expenses between users (without group)
exports.settleDirectExpenses = (req, res) => {
  const { toUserId, amount } = req.body;
  const fromUserId = req.user.id;

  if (!toUserId || !amount) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Create settlement record (using null for group_id)
  db.run(
    'INSERT INTO settlements (group_id, from_user_id, to_user_id, amount) VALUES (?, ?, ?, ?)',
    [null, fromUserId, toUserId, amount],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      // Update expense shares as settled
      db.all(
        `SELECT es.id FROM expense_shares es
         JOIN expenses e ON es.expense_id = e.id
         WHERE e.group_id IS NULL AND es.user_id = ? AND e.paid_by = ? AND es.is_settled = 0`,
        [fromUserId, toUserId],
        (err, shares) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }

          if (shares.length > 0) {
            const shareIds = shares.map(share => share.id).join(',');
            db.run(
              `UPDATE expense_shares SET is_settled = 1 WHERE id IN (${shareIds})`,
              err => {
                if (err) {
                  console.error(err.message);
                  return res.status(500).json({ message: 'Server error' });
                }

                res.json({ message: 'Settlement recorded successfully' });
              }
            );
          } else {
            res.json({ message: 'Settlement recorded successfully' });
          }
        }
      );
    }
  );
}; 