const client = require('../db');
const { body, validationResult } = require('express-validator');

// Create a new user or update login count if the user already exists
exports.createUser = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Please enter a valid email'),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email } = req.body;

    // Check if the user already exists
    const checkQuery = 'SELECT * FROM users WHERE username = $1 AND email = $2';
    client.query(checkQuery, [username, email])
      .then(result => {
        if (result.rows.length > 0) {
          // User exists, increment login_count
          const existingUser = result.rows[0];
          const updateQuery = 'UPDATE users SET login_count = login_count + 1 WHERE id = $1 RETURNING *';
          return client.query(updateQuery, [existingUser.id]);
        } else {
          // User does not exist, create a new user
          const insertQuery = 'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING *';
          return client.query(insertQuery, [username, email]);
        }
      })
      .then(result => res.status(201).json(result.rows[0]))
      .catch(err => res.status(500).json({ error: err.message }));
  }
];

// Get all users
exports.getUsers = (req, res) => {
  client.query('SELECT * FROM users')
    .then(result => res.json(result.rows))
    .catch(err => res.status(500).json({ error: err.message }));
};

// Update a user by ID
exports.updateUser = [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),

  (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    const query = 'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING *';
    client.query(query, [username, email, id])
      .then(result => res.json(result.rows[0]))
      .catch(err => res.status(500).json({ error: err.message }));
  }
];

// Delete a user by ID
exports.deleteUser = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
  client.query(query, [id])
    .then(result => res.json({ message: 'User deleted successfully', user: result.rows[0] }))
    .catch(err => res.status(500).json({ error: err.message }));
};
