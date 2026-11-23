import express from 'express';
import { OllamaService } from '../services/ollamaService.js';
import { MemoryService } from '../services/memoryService.js';
import { MemoryProcessingService } from '../services/memoryProcessingService.js';
import { authenticate } from '../middleware/auth.js';

export const chatRouter = express.Router();

/**
 * POST /api/chat/stream
 * Path A: Stream conversation response from Ollama
 * After streaming finishes: triggers Path B asynchronously for Memory Processing
 */
chatRouter.post('/stream', authenticate, async (req, res) => {
  const { messages } = req.body;
  const userId = req.user.id;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Nachrichten-Array ist erforderlich.' });
  }

  // Check Ollama status first
  const status = await OllamaService.checkStatus();
  if (!status.connected) {
    return res.status(503).json({
      error: `Ollama ist nicht erreichbar. ${status.error || 'Bitte stelle sicher, dass Ollama läuft.'}`,
      connected: false,
    });
  }

  // Get active system prompt and inject user memories into system context
  const baseSystemPrompt = OllamaService.getSystemPrompt();
  const memoriesContext = MemoryService.getMemoriesForContext(userId, 40);

  let fullSystemPrompt = baseSystemPrompt;
  if (memoriesContext) {
    fullSystemPrompt += `\n\n### Deine Erinnerungen über diesen Nutzer (Max Memory):\n${memoriesContext}\nNutze dieses Wissen ganz natürlich und persönlich in deinen Antworten, ohne steif zu wirken.`;
  }

  // Format messages payload for Ollama
  // Note: Only current conversation messages are sent from client memory; they are not saved to database!
  const ollamaMessages = [
    { role: 'system', content: fullSystemPrompt },
    ...messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content),
    })),
  ];

  // Set headers for Server-Sent Events (SSE) streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let fullAssistantResponse = '';
  const lastUserMessage = messages[messages.length - 1]?.content || '';

  try {
    await OllamaService.streamChat(ollamaMessages, (chunk) => {
      fullAssistantResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    // Send completion event
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    // ==========================================
    // PATH B: Memory Processing (Asynchronous)
    // Runs in the background without blocking the user
    // ==========================================
    if (fullAssistantResponse && lastUserMessage) {
      setImmediate(() => {
        MemoryProcessingService.processTurnAsync(userId, lastUserMessage, fullAssistantResponse)
          .catch((err) => console.error('[Path B Background Error]', err));
      });
    }
  } catch (err) {
    console.error('[Chat Stream Error]', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Fehler beim Generieren der Antwort.' })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/chat/status
 * Check Ollama availability and current model
 */
chatRouter.get('/status', authenticate, async (req, res) => {
  const status = await OllamaService.checkStatus();
  res.json(status);
});
