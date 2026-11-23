import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { db, getAllSettings, setSetting } from '../db.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { MemoryService } from '../services/memoryService.js';
import { OllamaService } from '../services/ollamaService.js';
import { getAuditLogs, logAudit } from '../services/auditService.js';

export const adminRouter = express.Router();

// Require both valid token AND ADMIN role on all admin routes
adminRouter.use(authenticate, requireAdmin);

// ==========================================
// 1. OVERVIEW & SYSTEM METRICS
// ==========================================
adminRouter.get('/overview', async (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUserCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_locked = 0').get().count;
    const totalMemories = db.prepare('SELECT COUNT(*) as count FROM memories').get().count;

    const systemStorage = MemoryService.getSystemStorageUsed();
    const ollamaStatus = await OllamaService.checkStatus();

    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      users: {
        total: userCount,
        active: activeUserCount,
      },
      memories: {
        count: totalMemories,
        totalBytes: systemStorage.totalBytes,
        formattedTotal: systemStorage.formattedTotal,
      },
      ollama: ollamaStatus,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(uptime),
        memoryHeapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        memoryRss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. USERS MANAGEMENT
// ==========================================
adminRouter.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT id, username, email, role, avatar_color, is_locked, created_at, updated_at,
    (SELECT COUNT(*) FROM memories WHERE user_id = users.id) as memory_count,
    (SELECT COALESCE(SUM(data_size_bytes), 0) FROM memories WHERE user_id = users.id) as memory_bytes
  FROM users
  ORDER BY created_at ASC
  `).all();

  const formatted = users.map((u) => ({
    ...u,
    formatted_memory: MemoryService.formatBytes(Number(u.memory_bytes)),
  }));

  res.json({ users: formatted });
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', (req, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'USER'].includes(role)) {
    return res.status(400).json({ error: 'Ungültige Rolle.' });
  }

  // Prevent admin from removing their own admin status if they are the only admin
  if (req.user.id === req.params.id && role !== 'ADMIN') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get().count;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Du kannst dir nicht selbst die Admin-Rolle entziehen, wenn du der einzige Administrator bist.' });
    }
  }

  db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, req.params.id);
  logAudit(req.user.id, 'CHANGE_USER_ROLE', { targetUserId: req.params.id, newRole: role }, req.ip);

  res.json({ success: true });
});

// PATCH /api/admin/users/:id/lock
adminRouter.patch('/users/:id/lock', (req, res) => {
  const { is_locked } = req.body;
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Du kannst deinen eigenen Account nicht sperren.' });
  }

  db.prepare('UPDATE users SET is_locked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_locked ? 1 : 0, req.params.id);
  logAudit(req.user.id, is_locked ? 'LOCK_USER' : 'UNLOCK_USER', { targetUserId: req.params.id }, req.ip);

  res.json({ success: true });
});

// DELETE /api/admin/users/:id
adminRouter.delete('/users/:id', (req, res) => {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Du kannst deinen eigenen Account nicht löschen.' });
  }

  // Check if target is last admin
  const target = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id);
  if (target?.role === 'ADMIN') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'").get().count;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Der letzte Administrator kann nicht gelöscht werden.' });
    }
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  logAudit(req.user.id, 'DELETE_USER', { targetUserId: req.params.id }, req.ip);

  res.json({ success: true });
});

// ==========================================
// 3. REGISTRATION & INVITATION CODES
// ==========================================
adminRouter.get('/registration', (req, res) => {
  const settings = getAllSettings();
  const inviteCodes = db.prepare(`
    SELECT i.*, u.username as creator_username
    FROM invite_codes i
    LEFT JOIN users u ON i.created_by = u.id
    ORDER BY i.created_at DESC
  `).all();

  res.json({
    mode: settings.registration_mode || 'PUBLIC',
    inviteCodes,
  });
});

adminRouter.post('/registration/mode', (req, res) => {
  const { mode } = req.body;
  if (!['PUBLIC', 'INVITE_ONLY'].includes(mode)) {
    return res.status(400).json({ error: 'Ungültiger Registrierungsmodus.' });
  }
  setSetting('registration_mode', mode);
  logAudit(req.user.id, 'CHANGE_REGISTRATION_MODE', { newMode: mode }, req.ip);
  res.json({ success: true, mode });
});

adminRouter.post('/registration/invite-codes', (req, res) => {
  const { code, max_uses, expires_at } = req.body;
  const codeVal = (code || `MAX-${crypto.randomBytes(3).toString('hex').toUpperCase()}`).trim().toUpperCase();

  const id = crypto.randomUUID();
  try {
    db.prepare(`
      INSERT INTO invite_codes (id, code, created_by, max_uses, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, codeVal, req.user.id, parseInt(max_uses, 10) || 1, expires_at || null);

    logAudit(req.user.id, 'CREATE_INVITE_CODE', { code: codeVal, max_uses }, req.ip);
    res.status(201).json({ success: true, code: codeVal });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Einladungscode existiert bereits.' });
    }
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch('/registration/invite-codes/:id', (req, res) => {
  const { is_active } = req.body;
  db.prepare('UPDATE invite_codes SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
  res.json({ success: true });
});

adminRouter.delete('/registration/invite-codes/:id', (req, res) => {
  db.prepare('DELETE FROM invite_codes WHERE id = ?').run(req.params.id);
  logAudit(req.user.id, 'DELETE_INVITE_CODE', { codeId: req.params.id }, req.ip);
  res.json({ success: true });
});

// ==========================================
// 4. MCP MANAGEMENT (Future-Ready Architecture)
// ==========================================
adminRouter.get('/mcp', (req, res) => {
  const settings = getAllSettings();
  res.json({
    enabled: settings.mcp_enabled === 'true',
    maxServersPerUser: parseInt(settings.mcp_max_servers_per_user || '5', 10),
  });
});

adminRouter.post('/mcp', (req, res) => {
  const { enabled, maxServersPerUser } = req.body;
  if (enabled !== undefined) {
    setSetting('mcp_enabled', enabled ? 'true' : 'false');
  }
  if (maxServersPerUser !== undefined) {
    setSetting('mcp_max_servers_per_user', String(maxServersPerUser));
  }
  logAudit(req.user.id, 'UPDATE_MCP_SETTINGS', { enabled, maxServersPerUser }, req.ip);
  res.json({ success: true });
});

// ==========================================
// 5. AI & OLLAMA SETTINGS
// ==========================================
adminRouter.get('/ai', async (req, res) => {
  const settings = getAllSettings();
  const ollamaStatus = await OllamaService.checkStatus();

  res.json({
    baseUrl: settings.ollama_base_url || 'http://localhost:11434',
    model: settings.ollama_model || 'llama3.2:latest',
    systemPrompt: settings.system_prompt || '',
    temperature: parseFloat(settings.temperature || '0.7'),
    status: ollamaStatus,
  });
});

adminRouter.post('/ai', async (req, res) => {
  const { baseUrl, model, systemPrompt, temperature } = req.body;

  if (baseUrl !== undefined) setSetting('ollama_base_url', baseUrl.trim());
  if (model !== undefined) setSetting('ollama_model', model.trim());
  if (systemPrompt !== undefined) setSetting('system_prompt', systemPrompt.trim());
  if (temperature !== undefined) setSetting('temperature', String(temperature));

  logAudit(req.user.id, 'UPDATE_AI_SETTINGS', { baseUrl, model, temperature }, req.ip);

  // Return new status
  const status = await OllamaService.checkStatus();
  res.json({ success: true, status });
});

// Test connection endpoint
adminRouter.post('/ai/test', async (req, res) => {
  const status = await OllamaService.checkStatus();
  res.json(status);
});

// ==========================================
// 6. SYSTEM LOGS & BACKUPS
// ==========================================
adminRouter.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const logs = getAuditLogs(limit);
  res.json({ logs });
});

// Backup creation
adminRouter.post('/backup', (req, res) => {
  try {
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), '../data');
    const backupDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.db`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Use SQLite backup API / vacuum into
    db.exec(`VACUUM INTO '${backupFilePath}';`);

    const stats = fs.statSync(backupFilePath);
    logAudit(req.user.id, 'CREATE_BACKUP', { file: backupFileName, size: stats.size }, req.ip);

    res.json({
      success: true,
      backupFile: backupFileName,
      sizeBytes: stats.size,
      formattedSize: MemoryService.formatBytes(stats.size),
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Fehler beim Erstellen des Backups: ' + err.message });
  }
});

// List backups
adminRouter.get('/backups', (req, res) => {
  try {
    const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), '../data');
    const backupDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      return res.json({ backups: [] });
    }

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.db'));
    const backups = files.map((f) => {
      const stats = fs.statSync(path.join(backupDir, f));
      return {
        filename: f,
        sizeBytes: stats.size,
        formattedSize: MemoryService.formatBytes(stats.size),
        createdAt: stats.birthtime,
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ backups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download backup file
adminRouter.get('/backups/:filename', (req, res) => {
  const dataDir = process.env.DATA_DIR || path.resolve(process.cwd(), '../data');
  const backupDir = path.join(dataDir, 'backups');
  const filename = path.basename(req.params.filename);
  const filePath = path.join(backupDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Backup-Datei nicht gefunden.' });
  }

  res.download(filePath, filename);
});
