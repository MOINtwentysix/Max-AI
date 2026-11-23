import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

const DB_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), '../data');
const DB_PATH = path.join(DB_DIR, 'max.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency & performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    -- Settings table for global app configs
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'USER')),
      avatar_color TEXT DEFAULT '#3B82F6',
      first_name TEXT DEFAULT '',
      is_locked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Invitation codes
    CREATE TABLE IF NOT EXISTS invite_codes (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      created_by TEXT,
      max_uses INTEGER DEFAULT 1,
      uses_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Memories table (Max LTM - Long Time Memory)
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Persönliches', 'Interessen', 'Projekte', 'Personen', 'Vorlieben', 'Wissen', 'Sonstiges')),
      origin TEXT NOT NULL CHECK(origin IN ('USER_STATEMENT', 'MAX_INFERRED')),
      confidence REAL NOT NULL CHECK(confidence >= 0.0 AND confidence <= 1.0),
      data_size_bytes INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);

    -- Audit Logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migration: Add first_name column to users if table already existed without it
  try {
    db.exec(`ALTER TABLE users ADD COLUMN first_name TEXT DEFAULT '';`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Default global settings
  const defaultSettings = [
    ['registration_mode', 'PUBLIC'], // 'PUBLIC' or 'INVITE_ONLY'
    ['maintenance_mode', 'false'],   // 'true' or 'false'
    ['ollama_base_url', process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'],
    ['ollama_model', process.env.OLLAMA_MODEL || 'llama3.2:latest'],
    ['system_prompt', 'Du bist Max, ein persönlicher, empathischer und kluger digitaler Begleiter. Antworte auf Deutsch, präzise und hilfsbereit.'],
    ['temperature', '0.7'],
    ['mcp_enabled', 'false'],
    ['mcp_max_servers_per_user', '5'],
  ];

  const checkStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const [key, val] of defaultSettings) {
    const row = checkStmt.get(key);
    if (!row) {
      insertStmt.run(key, val);
    }
  }

  console.log(`[Database] Initialized SQLite at ${DB_PATH}`);
}

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

export function setSetting(key, value) {
  const existing = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
  if (existing) {
    db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(value, key);
  } else {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}

export function getAllSettings() {
  const rows = db.prepare('SELECT key, value, updated_at FROM settings').all();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}
