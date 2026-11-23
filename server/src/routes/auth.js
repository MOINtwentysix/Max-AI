import express from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db, getSetting } from '../db.js';
import { JWT_SECRET, authenticate } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

export const authRouter = express.Router();

// Rate limiting for auth endpoints (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Zu viele Versuche von dieser IP. Bitte warte etwas.' }
});

// GET /api/auth/mode - Public info on registration mode
authRouter.get('/mode', (req, res) => {
  const mode = getSetting('registration_mode') || 'PUBLIC';
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  res.json({
    registrationMode: mode,
    isFirstUser: userCount === 0
  });
});

// POST /api/auth/verify-code - Verify an invite code and show who invited them
authRouter.post('/verify-code', authLimiter, (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Bitte gib einen Einladungscode ein.' });
  }

  const cleanCode = String(code).trim().toUpperCase();
  const inviteCodeRecord = db.prepare(`
    SELECT i.*, u.username as inviter_username
    FROM invite_codes i
    LEFT JOIN users u ON i.created_by = u.id
    WHERE UPPER(i.code) = ? AND i.is_active = 1
  `).get(cleanCode);

  if (!inviteCodeRecord) {
    return res.status(400).json({ error: 'Ungültiger oder deaktivierter Einladungscode.' });
  }

  if (inviteCodeRecord.expires_at && new Date(inviteCodeRecord.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Dieser Einladungscode ist abgelaufen.' });
  }

  if (inviteCodeRecord.max_uses > 0 && inviteCodeRecord.uses_count >= inviteCodeRecord.max_uses) {
    return res.status(400).json({ error: 'Dieser Einladungscode wurde bereits maximal oft verwendet.' });
  }

  res.json({
    valid: true,
    code: inviteCodeRecord.code,
    inviterUsername: inviteCodeRecord.inviter_username || 'Ein Max-Administrator',
    usesRemaining: inviteCodeRecord.max_uses > 0 ? (inviteCodeRecord.max_uses - inviteCodeRecord.uses_count) : 'Unbegrenzt',
  });
});

// POST /api/auth/register
authRouter.post('/register', authLimiter, async (req, res) => {
  const { username, email, password, inviteCode } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Benutzername, E-Mail und Passwort sind erforderlich.' });
  }

  const cleanUsername = String(username).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (cleanUsername.length < 3 || cleanUsername.length > 30) {
    return res.status(400).json({ error: 'Benutzername muss zwischen 3 und 30 Zeichen lang sein.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Das Passwort muss mindestens 6 Zeichen lang sein.' });
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const isFirstUser = (userCount === 0);
  const regMode = getSetting('registration_mode') || 'PUBLIC';

  let inviteCodeRecord = null;
  if (!isFirstUser && regMode === 'INVITE_ONLY') {
    if (!inviteCode) {
      return res.status(400).json({ error: 'Einladungscode ist für die Registrierung erforderlich.' });
    }
    const cleanCode = String(inviteCode).trim().toUpperCase();
    inviteCodeRecord = db.prepare(`
      SELECT * FROM invite_codes 
      WHERE UPPER(code) = ? AND is_active = 1
    `).get(cleanCode);

    if (!inviteCodeRecord) {
      return res.status(400).json({ error: 'Ungültiger oder deaktivierter Einladungscode.' });
    }

    if (inviteCodeRecord.expires_at && new Date(inviteCodeRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Dieser Einladungscode ist abgelaufen.' });
    }

    if (inviteCodeRecord.max_uses > 0 && inviteCodeRecord.uses_count >= inviteCodeRecord.max_uses) {
      return res.status(400).json({ error: 'Dieser Einladungscode wurde bereits maximal oft verwendet.' });
    }
  }

  const existingUser = db.prepare('SELECT id, username, email FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?').get(cleanUsername.toLowerCase(), cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'Benutzername oder E-Mail ist bereits vergeben.' });
  }

  const role = isFirstUser ? 'ADMIN' : 'USER';
  const userId = crypto.randomUUID();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  try {
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, role, avatar_color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, cleanUsername, cleanEmail, passwordHash, role, '#3B82F6');

    if (inviteCodeRecord) {
      db.prepare(`
        UPDATE invite_codes 
        SET uses_count = uses_count + 1 
        WHERE id = ?
      `).run(inviteCodeRecord.id);
    }

    logAudit(userId, 'USER_REGISTERED', { username: cleanUsername, email: cleanEmail, role }, req.ip);

    const token = jwt.sign({ userId, username: cleanUsername, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: isFirstUser ? 'Willkommen! Du wurdest als System-Administrator registriert.' : 'Registrierung erfolgreich.',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail,
        role,
        avatar_color: '#3B82F6'
      }
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: 'Fehler bei der Registrierung.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: 'Benutzername/E-Mail und Passwort sind erforderlich.' });
  }

  const query = String(usernameOrEmail).trim().toLowerCase();
  const user = db.prepare(`
    SELECT * FROM users 
    WHERE LOWER(username) = ? OR LOWER(email) = ?
  `).get(query, query);

  if (!user) {
    return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
  }

  if (user.is_locked) {
    return res.status(403).json({ error: 'Dieser Account wurde gesperrt. Bitte wende dich an den Administrator.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    logAudit(user.id, 'LOGIN_FAILED', { reason: 'Wrong password' }, req.ip);
    return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

  logAudit(user.id, 'USER_LOGIN', {}, req.ip);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar_color: user.avatar_color
    }
  });
});

// GET /api/auth/me - Verify session & get current profile
authRouter.get('/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      avatar_color: req.user.avatar_color
    }
  });
});

// GET /api/auth/my-invite-code - Get or generate personal invite code for current user
authRouter.get('/my-invite-code', authenticate, (req, res) => {
  try {
    let code = db.prepare(`
      SELECT * FROM invite_codes 
      WHERE created_by = ? AND is_active = 1
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(req.user.id);

    if (!code) {
      const codeStr = `MAX-${req.user.username.toUpperCase().slice(0, 4)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO invite_codes (id, code, created_by, max_uses, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, codeStr, req.user.id, 5, null);

      code = db.prepare('SELECT * FROM invite_codes WHERE id = ?').get(id);
    }

    res.json({
      inviteCode: code.code,
      maxUses: code.max_uses,
      usesCount: code.uses_count,
      expiresAt: code.expires_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/auth/profile - Update own profile
authRouter.patch('/profile', authenticate, (req, res) => {
  const { avatar_color, username } = req.body;
  const updates = [];
  const params = [];

  if (avatar_color) {
    updates.push('avatar_color = ?');
    params.push(avatar_color);
  }

  if (username && username.trim().length >= 3) {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?').get(username.trim().toLowerCase(), req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'Benutzername bereits vergeben.' });
    }
    updates.push('username = ?');
    params.push(username.trim());
  }

  if (updates.length === 0) {
    return res.json({ user: req.user });
  }

  params.push(req.user.id);
  db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...params);

  const updatedUser = db.prepare('SELECT id, username, email, role, avatar_color FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: updatedUser });
});
