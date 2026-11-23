import crypto from 'node:crypto';
import { db } from '../db.js';

export function logAudit(userId, action, details = '', ipAddress = '') {
  try {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, details, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, userId || 'SYSTEM', action, typeof details === 'object' ? JSON.stringify(details) : String(details), ipAddress);
  } catch (err) {
    console.error('[AuditLog] Failed to log:', err);
  }
}

export function getAuditLogs(limit = 100) {
  return db.prepare(`
    SELECT a.*, u.username 
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit);
}
