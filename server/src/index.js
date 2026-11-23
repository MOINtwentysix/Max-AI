import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

import { initDatabase } from './db.js';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { memoryRouter } from './routes/memory.js';
import { adminRouter } from './routes/admin.js';

dotenv.config();

// Initialize SQLite database and tables
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middlewares
app.use(cors({
  origin: '*', // can be restricted to FRONTEND_URL in prod
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (sanitized, no credentials or private data logged)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Do not log request body or auth headers for privacy
    console.log(`[HTTP] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Max AI Buddy',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend in production if built
const clientDist = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientDist)) {
  console.log(`[Server] Serving static client build from ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err.message);
  res.status(500).json({ error: 'Interner Serverfehler aufgetreten.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 Max AI Buddy Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});
