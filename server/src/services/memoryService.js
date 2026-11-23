import crypto from 'node:crypto';
import { db } from '../db.js';

const MAX_STORAGE_BYTES_PER_USER = 1024 * 1024 * 1024; // 1 GB in bytes

export class MemoryService {
  /**
   * Calculate data size for a memory entry (characters in UTF-8 + row overhead)
   */
  static calculateByteSize(memory) {
    const jsonStr = JSON.stringify({
      id: memory.id,
      user_id: memory.user_id,
      content: memory.content,
      category: memory.category,
      origin: memory.origin,
      confidence: memory.confidence,
    });
    return Buffer.byteLength(jsonStr, 'utf8') + 64; // row index overhead
  }

  /**
   * Get total memory used by a user in bytes
   */
  static getUserStorageUsed(userId) {
    const row = db.prepare(`
      SELECT COALESCE(SUM(data_size_bytes), 0) as totalBytes, COUNT(*) as count 
      FROM memories 
      WHERE user_id = ?
    `).get(userId);

    const totalBytes = Number(row?.totalBytes || 0);
    const count = Number(row?.count || 0);
    return {
      usedBytes: totalBytes,
      maxBytes: MAX_STORAGE_BYTES_PER_USER,
      usedPercentage: ((totalBytes / MAX_STORAGE_BYTES_PER_USER) * 100).toFixed(2),
      formattedUsed: this.formatBytes(totalBytes),
      formattedMax: '1 GB',
      count,
    };
  }

  /**
   * Get total memory storage across the entire system
   */
  static getSystemStorageUsed() {
    const row = db.prepare(`
      SELECT COALESCE(SUM(data_size_bytes), 0) as totalBytes, COUNT(*) as count 
      FROM memories
    `).get();

    const totalBytes = Number(row?.totalBytes || 0);
    const count = Number(row?.count || 0);
    return {
      totalBytes,
      formattedTotal: this.formatBytes(totalBytes),
      count,
    };
  }

  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * List memories for a user with optional filter & search
   */
  static listMemories(userId, { category, search } = {}) {
    let sql = 'SELECT * FROM memories WHERE user_id = ?';
    const params = [userId];

    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search && search.trim()) {
      sql += ' AND content LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    sql += ' ORDER BY updated_at DESC';
    return db.prepare(sql).all(...params);
  }

  /**
   * Create a new memory
   */
  static createMemory(userId, { content, category, origin, confidence }) {
    if (!content || !category) {
      throw new Error('Inhalt und Kategorie sind erforderlich.');
    }

    const validCategories = ['Persönliches', 'Interessen', 'Projekte', 'Personen', 'Vorlieben', 'Wissen', 'Sonstiges'];
    if (!validCategories.includes(category)) {
      category = 'Sonstiges';
    }

    const validOrigin = origin === 'MAX_INFERRED' ? 'MAX_INFERRED' : 'USER_STATEMENT';
    const conf = typeof confidence === 'number' ? Math.max(0, Math.min(1, confidence)) : (validOrigin === 'USER_STATEMENT' ? 1.0 : 0.85);

    const id = crypto.randomUUID();
    const tempObj = { id, user_id: userId, content, category, origin: validOrigin, confidence: conf };
    const sizeBytes = this.calculateByteSize(tempObj);

    // Enforce 1GB limit
    const current = this.getUserStorageUsed(userId);
    if (current.usedBytes + sizeBytes > MAX_STORAGE_BYTES_PER_USER) {
      throw new Error('Speicherlimit von 1 GB erreicht! Bitte lösche einige Erinnerungen, um Platz freizugeben.');
    }

    db.prepare(`
      INSERT INTO memories (id, user_id, content, category, origin, confidence, data_size_bytes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, content.trim(), category, validOrigin, conf, sizeBytes);

    return db.prepare('SELECT * FROM memories WHERE id = ?').get(id);
  }

  /**
   * Update an existing memory
   */
  static updateMemory(userId, memoryId, { content, category, confidence }) {
    const memory = db.prepare('SELECT * FROM memories WHERE id = ? AND user_id = ?').get(memoryId, userId);
    if (!memory) {
      throw new Error('Erinnerung nicht gefunden.');
    }

    const newContent = content !== undefined ? content.trim() : memory.content;
    const newCategory = category !== undefined ? category : memory.category;
    const newConf = confidence !== undefined ? Math.max(0, Math.min(1, confidence)) : memory.confidence;

    const newSize = this.calculateByteSize({
      id: memoryId,
      user_id: userId,
      content: newContent,
      category: newCategory,
      origin: memory.origin,
      confidence: newConf,
    });

    const diff = newSize - memory.data_size_bytes;
    const current = this.getUserStorageUsed(userId);
    if (diff > 0 && current.usedBytes + diff > MAX_STORAGE_BYTES_PER_USER) {
      throw new Error('Speicherlimit von 1 GB überschritten.');
    }

    db.prepare(`
      UPDATE memories
      SET content = ?, category = ?, confidence = ?, data_size_bytes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(newContent, newCategory, newConf, newSize, memoryId, userId);

    return db.prepare('SELECT * FROM memories WHERE id = ?').get(memoryId);
  }

  /**
   * Delete a memory
   */
  static deleteMemory(userId, memoryId) {
    const res = db.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').run(memoryId, userId);
    return res.changes > 0;
  }

  /**
   * Clear all memories for a user
   */
  static clearAllMemories(userId) {
    const res = db.prepare('DELETE FROM memories WHERE user_id = ?').run(userId);
    return res.changes;
  }

  /**
   * Get all memories formatted as context for Ollama prompt injection
   */
  static getMemoriesForContext(userId, limit = 50) {
    const memories = db.prepare(`
      SELECT category, origin, content 
      FROM memories 
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(userId, limit);

    if (!memories.length) return '';

    return memories.map((m) => {
      const source = m.origin === 'USER_STATEMENT' ? 'Nutzer-Aussage' : 'Max-Beobachtung';
      return `[${m.category}] (${source}): ${m.content}`;
    }).join('\n');
  }
}
