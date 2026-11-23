import express from 'express';
import crypto from 'node:crypto';
import { OllamaService } from '../services/ollamaService.js';
import { MemoryService } from '../services/memoryService.js';
import { MemoryProcessingService } from '../services/memoryProcessingService.js';
import { RequestQueueManager } from '../services/requestQueueManager.js';
import { authenticate } from '../middleware/auth.js';

export const chatRouter = express.Router();

/**
 * POST /api/chat/stream
 * Handles streaming chat responses through the orderly FIFO RequestQueueManager.
 * Emits live SSE events:
 * - { type: "queue", position: number, total: number } when waiting
 * - { chunk: string } when generating
 * - { done: true } when finished
 */
chatRouter.post('/stream', authenticate, async (req, res) => {
  const { messages } = req.body;
  const user = req.user;
  const userId = user.id;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Nachrichten-Array ist erforderlich.' });
  }

  // Set SSE headers immediately
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const requestId = crypto.randomUUID();

  // If client disconnects while waiting in queue, remove it from queue
  req.on('close', () => {
    RequestQueueManager.remove(requestId);
  });

  try {
    await RequestQueueManager.enqueue(
      requestId,
      async () => {
        // Now executing: check Ollama status
        const status = await OllamaService.checkStatus();
        if (!status.connected) {
          throw new Error('Max Sprachmodell ist aktuell nicht erreichbar.');
        }

        // Active prompt construction
        const baseSystemPrompt = OllamaService.getSystemPrompt();
        const memoriesContext = MemoryService.getMemoriesForContext(userId, 40);

        let fullSystemPrompt = baseSystemPrompt;
        if (user.first_name && user.first_name.trim()) {
          fullSystemPrompt += `\n\n### Wichtiger Nutzer-Vorname:\nDer Nutzer heißt mit Vornamen "${user.first_name.trim()}". Sprich ihn persönlich mit diesem Vornamen an!`;
        }
        if (memoriesContext) {
          fullSystemPrompt += `\n\n### Deine Erinnerungen über diesen Nutzer (Max LTM):\n${memoriesContext}\nNutze dieses Wissen ganz natürlich und persönlich.`;
        }

        const ollamaMessages = [
          { role: 'system', content: fullSystemPrompt },
          ...messages.map((m) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: String(m.content),
          })),
        ];

        let fullAssistantResponse = '';
        const lastUserMessage = messages[messages.length - 1]?.content || '';

        await OllamaService.streamChat(ollamaMessages, (chunk) => {
          fullAssistantResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

        // Path B: Asynchronous Memory Processing
        if (fullAssistantResponse && lastUserMessage) {
          setImmediate(() => {
            MemoryProcessingService.processTurnAsync(userId, lastUserMessage, fullAssistantResponse)
              .catch((err) => console.error('[Path B Error]', err));
          });
        }
      },
      (position, total) => {
        // Send queue position update to client
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ type: 'queue', position, total })}\n\n`);
        }
      }
    );
  } catch (err) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Fehler bei der Anfrage.' })}\n\n`);
      res.end();
    }
  }
});

chatRouter.get('/status', authenticate, async (req, res) => {
  const status = await OllamaService.checkStatus();
  res.json(status);
});
