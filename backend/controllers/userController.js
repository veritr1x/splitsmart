const db = require('../db/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Get all users
exports.getAllUsers = (req, res) => {
  db.all(
    'SELECT id, username, email, fullName FROM users',
    (err, users) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(users);
    }
  );
};

// Get current user's profile
exports.getCurrentUser = (req, res) => {
  const userId = req.user.id;
  db.get(
    'SELECT id, username, email, fullName FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    }
  );
};

// Get user by ID
exports.getUserById = (req, res) => {
  const { userId } = req.params;
  db.get(
    'SELECT id, username, email, fullName FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    }
  );
};

// Search users by username or email
exports.searchUsers = (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  const searchTerm = `%${query}%`;
  
  db.all(
    'SELECT id, username, email, fullName FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 10',
    [searchTerm, searchTerm],
    (err, users) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      res.json(users);
    }
  );
};

// Update user profile
exports.updateUserProfile = (req, res) => {
  const { fullName, email } = req.body;
  const userId = req.user.id;

  // Update user information
  db.run(
    'UPDATE users SET fullName = ?, email = ? WHERE id = ?',
    [fullName || req.user.fullName, email || req.user.email, userId],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get updated user info
      db.get(
        'SELECT id, username, email, fullName FROM users WHERE id = ?',
        [userId],
        (err, user) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }

          res.json(user);
        }
      );
    }
  );
};

// Get user's groups
exports.getUserGroups = (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT g.*, 
      (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
     FROM groups g
     JOIN group_members gm ON g.id = gm.group_id
     WHERE gm.user_id = ?
     ORDER BY g.created_at DESC`,
    [userId],
    (err, groups) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      // Get the total balance for each group
      const promises = groups.map(group => {
        return new Promise((resolve, reject) => {
          // Calculate what the user owes others
          db.get(
            `SELECT SUM(es.amount) as owes
             FROM expense_shares es
             JOIN expenses e ON es.expense_id = e.id
             WHERE e.group_id = ? AND es.user_id = ? AND e.paid_by != ? AND es.is_settled = 0`,
            [group.id, userId, userId],
            (err, owesResult) => {
              if (err) {
                reject(err);
                return;
              }

              // Calculate what others owe the user
              db.get(
                `SELECT SUM(es.amount) as owed
                 FROM expense_shares es
                 JOIN expenses e ON es.expense_id = e.id
                 WHERE e.group_id = ? AND es.user_id != ? AND e.paid_by = ? AND es.is_settled = 0`,
                [group.id, userId, userId],
                (err, owedResult) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  const owes = owesResult.owes || 0;
                  const owed = owedResult.owed || 0;
                  group.balance = owed - owes;
                  resolve(group);
                }
              );
            }
          );
        });
      });

      Promise.all(promises)
        .then(groupsWithBalance => {
          res.json(groupsWithBalance);
        })
        .catch(err => {
          console.error(err.message);
          res.status(500).json({ message: 'Server error' });
        });
    }
  );
};

// Create a new group
exports.createGroup = (req, res) => {
  const { name, description, members } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Group name is required' });
  }

  // Begin transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Create group
    db.run(
      'INSERT INTO groups (name, description, created_by) VALUES (?, ?, ?)',
      [name, description || '', userId],
      function (err) {
        if (err) {
          console.error(err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Server error' });
        }

        const groupId = this.lastID;

        // Add creator as a member
        db.run(
          'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
          [groupId, userId],
          err => {
            if (err) {
              console.error(err.message);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Server error' });
            }

            // Add other members if provided
            if (members && Array.isArray(members) && members.length > 0) {
              const memberPromises = members.map(memberId => {
                return new Promise((resolve, reject) => {
                  if (memberId === userId) {
                    resolve(); // Skip creator, already added
                    return;
                  }

                  db.run(
                    'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
                    [groupId, memberId],
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

              Promise.all(memberPromises)
                .then(() => {
                  db.run('COMMIT');
                  res.json({
                    id: groupId,
                    name,
                    description: description || '',
                    created_by: userId,
                    message: 'Group created successfully'
                  });
                })
                .catch(err => {
                  console.error(err.message);
                  db.run('ROLLBACK');
                  res.status(500).json({ message: 'Server error' });
                });
            } else {
              // No additional members to add
              db.run('COMMIT');
              res.json({
                id: groupId,
                name,
                description: description || '',
                created_by: userId,
                message: 'Group created successfully'
              });
            }
          }
        );
      }
    );
  });
};

// Add user to group
exports.addUserToGroup = (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const currentUserId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  // Check if current user is a member of the group
  db.get(
    'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
    [groupId, currentUserId],
    (err, member) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!member) {
        return res.status(403).json({ message: 'Not authorized to add members to this group' });
      }

      // Check if user already in group
      db.get(
        'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
        [groupId, userId],
        (err, existingMember) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }

          if (existingMember) {
            return res.status(400).json({ message: 'User is already a member of this group' });
          }

          // Add user to group
          db.run(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [groupId, userId],
            function (err) {
              if (err) {
                console.error(err.message);
                return res.status(500).json({ message: 'Server error' });
              }

              res.json({ message: 'User added to group successfully' });
            }
          );
        }
      );
    }
  );
};

// Get members of a group
exports.getGroupMembers = (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;
  
  // First check if user is a member of the group
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
      
      // Get all group members
      db.all(
        `SELECT u.id, u.username, u.fullName FROM users u
         JOIN group_members gm ON u.id = gm.user_id
         WHERE gm.group_id = ?`,
        [groupId],
        (err, members) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }
          
          res.json(members);
        }
      );
    }
  );
};

// Get user's friends
exports.getUserFriends = (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT u.id, u.username, u.fullName 
     FROM users u
     JOIN friendships f ON u.id = f.friend_id
     WHERE f.user_id = ?
     ORDER BY u.username ASC`,
    [userId],
    (err, friends) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      
      res.json(friends);
    }
  );
};

// Get user's friend balances
exports.getFriendBalances = (req, res) => {
  const userId = req.user.id;
  
  // Get all friends first
  db.all(
    `SELECT u.id, u.username, u.fullName 
     FROM users u
     JOIN friendships f ON u.id = f.friend_id
     WHERE f.user_id = ?
     ORDER BY u.username ASC`,
    [userId],
    (err, friends) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (friends.length === 0) {
        return res.json([]);
      }
      
      const promises = friends.map(friend => {
        return new Promise((resolve, reject) => {
          // Calculate what the user owes the friend
          db.get(
            `SELECT SUM(es.amount) as owes
             FROM expense_shares es
             JOIN expenses e ON es.expense_id = e.id
             WHERE e.group_id IS NULL
             AND es.user_id = ? AND e.paid_by = ? AND es.is_settled = 0`,
            [userId, friend.id],
            (err, owesResult) => {
              if (err) {
                reject(err);
                return;
              }
              
              // Calculate what the friend owes the user
              db.get(
                `SELECT SUM(es.amount) as owed
                 FROM expense_shares es
                 JOIN expenses e ON es.expense_id = e.id
                 WHERE e.group_id IS NULL
                 AND es.user_id = ? AND e.paid_by = ? AND es.is_settled = 0`,
                [friend.id, userId],
                (err, owedResult) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  
                  const owes = owesResult.owes || 0;
                  const owed = owedResult.owed || 0;
                  friend.balance = owed - owes;
                  resolve(friend);
                }
              );
            }
          );
        });
      });
      
      Promise.all(promises)
        .then(friendsWithBalances => {
          res.json(friendsWithBalances);
        })
        .catch(err => {
          console.error(err.message);
          res.status(500).json({ message: 'Server error' });
        });
    }
  );
};

// Add friend
exports.addFriend = (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.body;
  
  if (!friendId) {
    return res.status(400).json({ message: 'Friend ID is required' });
  }
  
  if (parseInt(friendId) === userId) {
    return res.status(400).json({ message: 'Cannot add yourself as a friend' });
  }
  
  // Check if friend exists
  db.get(
    'SELECT id FROM users WHERE id = ?',
    [friendId],
    (err, user) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if already friends
      db.get(
        'SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?',
        [userId, friendId],
        (err, friendship) => {
          if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Server error' });
          }
          
          if (friendship) {
            return res.status(400).json({ message: 'Already friends with this user' });
          }
          
          // Begin transaction to add bidirectional friendship
          db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // Add friend in one direction
            db.run(
              'INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)',
              [userId, friendId],
              function(err) {
                if (err) {
                  console.error(err.message);
                  db.run('ROLLBACK');
                  return res.status(500).json({ message: 'Server error' });
                }
                
                // Add friend in other direction (bidirectional)
                db.run(
                  'INSERT INTO friendships (user_id, friend_id) VALUES (?, ?)',
                  [friendId, userId],
                  function(err) {
                    if (err) {
                      console.error(err.message);
                      db.run('ROLLBACK');
                      return res.status(500).json({ message: 'Server error' });
                    }
                    
                    db.run('COMMIT');
                    res.json({ message: 'Friend added successfully' });
                  }
                );
              }
            );
          });
        }
      );
    }
  );
};

// Remove friend
exports.removeFriend = (req, res) => {
  const userId = req.user.id;
  const { friendId } = req.params;
  
  if (!friendId) {
    return res.status(400).json({ message: 'Friend ID is required' });
  }
  
  // Begin transaction to remove bidirectional friendship
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Remove friend in one direction
    db.run(
      'DELETE FROM friendships WHERE user_id = ? AND friend_id = ?',
      [userId, friendId],
      function(err) {
        if (err) {
          console.error(err.message);
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Server error' });
        }
        
        if (this.changes === 0) {
          db.run('ROLLBACK');
          return res.status(404).json({ message: 'Friendship not found' });
        }
        
        // Remove friend in other direction (bidirectional)
        db.run(
          'DELETE FROM friendships WHERE user_id = ? AND friend_id = ?',
          [friendId, userId],
          function(err) {
            if (err) {
              console.error(err.message);
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Server error' });
            }
            
            db.run('COMMIT');
            res.json({ message: 'Friend removed successfully' });
          }
        );
      }
    );
  });
};

// Find user by email
exports.findUserByEmail = (req, res) => {
  const { email } = req.query;
  const userId = req.user.id;
  
  console.log("Finding user by email:", email);
  
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  // Find user with the given email
  db.get(
    'SELECT id, username, email, fullName FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      
      if (!user) {
        console.log(`No user found with email: ${email}`);
        return res.status(404).json({ message: 'User not found with this email' });
      }
      
      if (parseInt(user.id) === parseInt(userId)) {
        return res.status(400).json({ message: 'You cannot add yourself as a friend' });
      }
      
      // Check if already friends
      db.get(
        'SELECT * FROM friendships WHERE user_id = ? AND friend_id = ?',
        [userId, user.id],
        (err, friendship) => {
          if (err) {
            console.error('Database error checking friendship:', err.message);
            return res.status(500).json({ message: 'Server error' });
          }
          
          if (friendship) {
            return res.status(400).json({ message: 'Already friends with this user' });
          }
          
          console.log(`User found: ${user.username}, ID: ${user.id}`);
          res.status(200).json(user);
        }
      );
    }
  );
}; 