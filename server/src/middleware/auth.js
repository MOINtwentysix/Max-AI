import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'max-super-secret-default-key-change-in-prod-3829104712';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht authentifiziert. Bitte einloggen.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists and is not locked
    const user = db.prepare('SELECT id, username, email, role, avatar_color, is_locked FROM users WHERE id = ?').get(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Benutzer existiert nicht mehr.' });
    }
    if (user.is_locked) {
      return res.status(403).json({ error: 'Dieser Account wurde gesperrt. Bitte wende dich an den Administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Ungültiges oder abgelaufenes Token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Zugriff verweigert. Administrator-Rechte erforderlich.' });
  }
  next();
}
