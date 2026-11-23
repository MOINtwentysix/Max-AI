import { getSetting } from '../db.js';

export class OllamaService {
  static getBaseUrl() {
    return getSetting('ollama_base_url') || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  static getModel() {
    return getSetting('ollama_model') || process.env.OLLAMA_MODEL || 'llama3.2:latest';
  }

  static getSystemPrompt() {
    return getSetting('system_prompt') || 'Du bist Max, ein persönlicher, intelligenter und treuer digitaler Begleiter.';
  }

  static getTemperature() {
    const t = parseFloat(getSetting('temperature'));
    return isNaN(t) ? 0.7 : t;
  }

  /**
   * Check if Ollama is accessible and list models
   */
  static async checkStatus() {
    const baseUrl = this.getBaseUrl();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          connected: false,
          error: `Ollama antwortete mit Status ${res.status}: ${res.statusText}`,
          models: [],
        };
      }

      const data = await res.json();
      const models = (data.models || []).map((m) => ({
        name: m.name,
        size: m.size,
        modified_at: m.modified_at,
        details: m.details,
      }));

      const currentModel = this.getModel();
      const modelAvailable = models.some((m) => m.name === currentModel || m.name.startsWith(currentModel));

      return {
        connected: true,
        baseUrl,
        currentModel,
        modelAvailable,
        models,
      };
    } catch (err) {
      let errorMsg = 'Ollama ist nicht erreichbar.';
      if (err.name === 'AbortError') {
        errorMsg = 'Zeitüberschreitung bei Verbindung zu Ollama (Timeout nach 4s).';
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
        errorMsg = `Verbindung zu Ollama unter ${baseUrl} fehlgeschlagen. Läuft Ollama?`;
      } else {
        errorMsg = `Ollama-Fehler: ${err.message}`;
      }

      return {
        connected: false,
        baseUrl,
        currentModel: this.getModel(),
        modelAvailable: false,
        error: errorMsg,
        models: [],
      };
    }
  }

  /**
   * Stream a chat completion with Ollama
   * @param {Array<{role: string, content: string}>} messages
   * @param {Function} onChunk - callback for each token string
   */
  static async streamChat(messages, onChunk) {
    const baseUrl = this.getBaseUrl();
    const model = this.getModel();
    const temperature = this.getTemperature();

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          temperature,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama Chat Error (${response.status}): ${errorText || response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep partial line

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            onChunk(parsed.message.content);
          }
          if (parsed.done) {
            return;
          }
        } catch (e) {
          // ignore partial JSON parse errors
        }
      }
    }
  }

  /**
   * Generate a non-streaming completion (e.g. for background memory analysis)
   */
  static async generate(prompt, formatJson = false) {
    const baseUrl = this.getBaseUrl();
    const model = this.getModel();

    const body = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.1, // low temperature for deterministic structured extraction
      },
    };

    if (formatJson) {
      body.format = 'json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for memory extraction

    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Generate Error (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}
