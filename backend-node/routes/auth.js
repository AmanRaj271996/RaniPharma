const express = require('express');
const bcrypt = require('bcryptjs');
const { queryOne, run } = require('../db');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = queryOne('SELECT * FROM Users WHERE Username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.PasswordHash)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = generateToken(user);
  res.json({ token, fullName: user.FullName, role: user.Role });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, fullName } = req.body;

  const existing = queryOne('SELECT Id FROM Users WHERE Username = ?', [username]);
  if (existing) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = run('INSERT INTO Users (Username, PasswordHash, FullName, Role) VALUES (?, ?, ?, ?)',
    [username, hash, fullName, 'Admin']);

  const user = { Id: result.lastInsertRowid, Username: username, FullName: fullName, Role: 'Admin' };
  const token = generateToken(user);
  res.json({ token, fullName: user.FullName, role: user.Role });
});

module.exports = router;
