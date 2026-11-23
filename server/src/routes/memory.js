import express from 'express';
import { MemoryService } from '../services/memoryService.js';
import { authenticate } from '../middleware/auth.js';

export const memoryRouter = express.Router();

// GET /api/memory - List all memories & storage quota for user
memoryRouter.get('/', authenticate, (req, res) => {
  try {
    const { category, search } = req.query;
    const memories = MemoryService.listMemories(req.user.id, { category, search });
    const storage = MemoryService.getUserStorageUsed(req.user.id);

    res.json({
      memories,
      storage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/memory - Create manual memory
memoryRouter.post('/', authenticate, (req, res) => {
  try {
    const { content, category, confidence } = req.body;
    if (!content || !category) {
      return res.status(400).json({ error: 'Inhalt und Kategorie sind erforderlich.' });
    }

    const newMemory = MemoryService.createMemory(req.user.id, {
      content,
      category,
      origin: 'USER_STATEMENT',
      confidence: confidence || 1.0,
    });

    const storage = MemoryService.getUserStorageUsed(req.user.id);
    res.status(201).json({ memory: newMemory, storage });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/memory/:id - Edit a memory
memoryRouter.patch('/:id', authenticate, (req, res) => {
  try {
    const { content, category, confidence } = req.body;
    const updated = MemoryService.updateMemory(req.user.id, req.params.id, {
      content,
      category,
      confidence,
    });
    const storage = MemoryService.getUserStorageUsed(req.user.id);
    res.json({ memory: updated, storage });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/memory/:id - Delete a memory
memoryRouter.delete('/:id', authenticate, (req, res) => {
  try {
    const success = MemoryService.deleteMemory(req.user.id, req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Erinnerung nicht gefunden.' });
    }
    const storage = MemoryService.getUserStorageUsed(req.user.id);
    res.json({ success: true, storage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/memory - Reset/clear all memories
memoryRouter.delete('/', authenticate, (req, res) => {
  try {
    const deletedCount = MemoryService.clearAllMemories(req.user.id);
    const storage = MemoryService.getUserStorageUsed(req.user.id);
    res.json({ success: true, deletedCount, storage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
