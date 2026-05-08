const express = require('express');
const session = require('express-session');
const bcrypt  = require('bcryptjs');
const path    = require('path');
const db      = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));  // serves login.html

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 }, // 1 hour
}));

// Serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// ── POST /login ──────────────────────────────────────────
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'All fields are required.' });

  try {
    // 1. Look up user by email
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const user = rows[0];

    // 2. Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    // 3. Save session
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ success: false, message: 'Session error.' });

      req.session.userId = user.id;
      req.session.email  = user.email;

      return res.status(200).json({ success: true, message: 'Login successful!', redirect: '/dashboard' });
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// ── Protected dashboard route ────────────────────────────
app.get('/dashboard', (req, res) => {
  if (!req.session.userId)
    return res.redirect('/');

  res.send(`<h2>Welcome, ${req.session.email}!</h2> <a href="/logout">Logout</a>`);
});

// ── Logout ───────────────────────────────────────────────
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));