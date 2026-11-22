require('dotenv').config();
const fs = require('fs');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const pool = require('./db');
const createBackup = require('./backup');

const app = express();
const port = Number(process.env.PORT || 3000);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  console.error('SESSION_SECRET must be set and contain at least 32 characters.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:', 'capacitor:', 'http://127.0.0.1:*', 'http://localhost:*']
    }
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser(sessionSecret));

function allowedOrigins() {
  return (process.env.API_ALLOWED_ORIGINS || 'capacitor://localhost,http://localhost:3000')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    if (allowedOrigins().includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    }
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret).update(value).digest('hex');
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

async function getSession(req) {
  const id = req.signedCookies && req.signedCookies.sotera_session;
  if (!/^[a-f0-9]{64}$/.test(id || '')) return null;
  const result = await pool.query(
    `SELECT s.id, s.csrf_token, s.expires_at, u.id AS user_id, u.name, u.username, u.email, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [id]
  );
  return result.rows[0] || null;
}

function csrfProtection(req, res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const supplied = req.get('X-CSRF-Token');
  getSession(req).then(session => {
    const cookieToken = session ? session.csrf_token : req.cookies.sotera_csrf;
    if (!cookieToken || !supplied || supplied.length !== 64 ||
        !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(cookieToken))) {
      return res.status(403).json({ error: 'Invalid CSRF token.' });
    }
    next();
  }).catch(() => res.status(500).json({ error: 'Session validation failed.' }));
}

async function requireRole(roles) {
  return async function (req, res, next) {
    const session = await getSession(req);
    if (!session) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(session.role)) return res.status(403).json({ error: 'Insufficient permissions.' });
    req.session = session;
    next();
  };
}

async function audit(session, action, req) {
  await pool.query(
    'INSERT INTO audit_log (user_id, action, ip_address, user_agent) VALUES ($1,$2,$3,$4)',
    [session ? session.user_id : null, action, req.ip, req.get('user-agent') || null]
  );
}

app.get('/api/csrf', async (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('sotera_csrf', token, { ...cookieOptions(), httpOnly: false });
  res.json({ token });
});

app.post('/api/auth/signup', csrfProtection, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Invalid name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email.' });
  if (password.length < 8 || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password does not meet requirements.' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const username = (name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'student').slice(0, 18);
    const result = await pool.query(
      `INSERT INTO users (name, username, email, password_hash, role)
       VALUES ($1,$2,$3,$4,'mahasiswa') RETURNING id,name,username,email,role,created_at`,
      [name, username, email, passwordHash]
    );
    const user = result.rows[0];
    await createLoginSession(res, user);
    await audit({ user_id: user.id }, 'signup', req);
    res.status(201).json({ user });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email is already registered.' });
    console.error(error);
    res.status(500).json({ error: 'Account creation failed.' });
  }
});

async function createLoginSession(res, user) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO sessions (id,user_id,csrf_token,expires_at)
     VALUES ($1,$2,$3,NOW() + interval '7 days')`,
    [sessionId, user.id, csrfToken]
  );
  res.cookie('sotera_session', sessionId, { ...cookieOptions(), signed: true });
  res.cookie('sotera_csrf', csrfToken, { ...cookieOptions(), httpOnly: false });
  res.locals.csrfToken = csrfToken;
  return csrfToken;
}

app.post('/api/auth/login', csrfProtection, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const result = await pool.query(
    'SELECT id,name,username,email,password_hash,role,created_at FROM users WHERE email=$1',
    [email]
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  delete user.password_hash;
  const csrfToken = await createLoginSession(res, user);
  await audit({ user_id: user.id }, 'login', req);
  res.json({ user, csrfToken });
});

app.post('/api/auth/logout', csrfProtection, async (req, res) => {
  const session = await getSession(req);
  if (session) {
    await pool.query('DELETE FROM sessions WHERE id=$1', [session.id]);
    await audit(session, 'logout', req);
  }
  res.clearCookie('sotera_session', { path: '/' });
  res.clearCookie('sotera_csrf', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated.' });
  res.json({
    user: {
      id: session.user_id, name: session.name, username: session.username,
      email: session.email, role: session.role
    },
    csrfToken: session.csrf_token
  });
});

app.get('/api/admin/status', requireRole(['admin']), async (req, res) => {
  const result = await pool.query('SELECT COUNT(*)::int AS users FROM users');
  res.json({ users: result.rows[0].users });
});

app.delete('/api/auth/account', csrfProtection, async (req, res) => {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Authentication required.' });
  await pool.query('DELETE FROM users WHERE id=$1', [session.user_id]);
  await audit(null, 'account_deleted', req);
  res.clearCookie('sotera_session', { path: '/' });
  res.clearCookie('sotera_csrf', { path: '/' });
  res.json({ ok: true });
});

app.use(express.static(path.join(__dirname, '../www'), {
  index: 'index.html',
  dotfiles: 'deny'
}));
app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../www/index.html'));
});

cron.schedule('0 2 * * *', async () => {
  try { await createBackup(); } catch (error) { console.error('Daily backup failed:', error); }
});
cron.schedule('15 3 * * 0', async () => {
  try { await createBackup(); } catch (error) { console.error('Weekly backup failed:', error); }
});
cron.schedule('*/30 * * * *', async () => {
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');
});

async function start() {
  await pool.query('SELECT 1');
  await pool.query('DELETE FROM sessions WHERE expires_at <= NOW()');

  const certPath = process.env.TLS_CERT_PATH;
  const keyPath = process.env.TLS_KEY_PATH;
  if (certPath && keyPath) {
    https.createServer({
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    }, app).listen(port, () => console.log(`SOTERA HTTPS API listening on port ${port}`));
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TLS_CERT_PATH and TLS_KEY_PATH are required in production.');
    }
    http.createServer(app).listen(port, () => {
      console.log(`SOTERA development API listening on http://localhost:${port}`);
    });
  }
}

start().catch(error => {
  console.error(error);
  process.exit(1);
});
