const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

router.get('/login', (req, res) => {
  res.render('auth/login');
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      req.session.user = { id: user.id, username: user.username, email: user.email };
      req.flash('success', 'Successfully logged in');
      res.redirect('/');
    } else {
      req.flash('error', 'Invalid credentials');
      res.redirect('/auth/login');
    }
  } catch (error) {
    req.flash('error', 'Login failed');
    res.redirect('/auth/login');
  }
});

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    req.flash('success', 'Registration successful. Please login.');
    res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', 'Registration failed');
    res.redirect('/auth/register');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;