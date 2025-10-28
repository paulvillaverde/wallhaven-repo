require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev_secret';

app.use(express.json());
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true
}));

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: __dirname }),
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 3600 * 1000,
    sameSite: 'lax',
    secure: false
  }
}));

function authRequired(req, res, next) {
  if (!req.session.user) return res.status(401).json({ ok: false, error: 'Not authenticated' });
  next();
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const stmt = db.prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)');
    stmt.run(email, hash, name || null, function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT') return res.status(409).json({ ok: false, error: 'Email already exists' });
        return res.status(500).json({ ok: false, error: 'Database error' });
      }
      const user = { id: this.lastID, email, name: name || null };
      req.session.user = { id: user.id, email: user.email, name: user.name };
      res.json({ ok: true, user });
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Email and password required' });

  db.get('SELECT id, email, password_hash, name FROM users WHERE email = ?', [email], async (err, row) => {
    if (err) return res.status(500).json({ ok: false, error: 'Database error' });
    if (!row) return res.status(401).json({ ok: false, error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: 'Invalid credentials' });

    req.session.user = { id: row.id, email: row.email, name: row.name };
    res.json({ ok: true, user: req.session.user });
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    res.clearCookie('connect.sid');
    if (err) return res.status(500).json({ ok: false, error: 'Failed to destroy session' });
    res.json({ ok: true });
  });
});

// current user
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.json({ ok: true, user: null });
  const id = req.session.user.id;
  db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ ok: false, error: 'Database error' });
    if (!row) return res.json({ ok: true, user: null });
    res.json({ ok: true, user: row });
  });
});

app.listen(PORT, () => console.log(`Auth server running on ${PORT}`));