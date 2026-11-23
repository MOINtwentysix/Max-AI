import { getSetting } from '../db.js';

export class OllamaService {
  static getBaseUrl() {
    return getSetting('ollama_base_url') || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  }

  static getModel() {
    return getSetting('ollama_model') || process.env.OLLAMA_MODEL || 'llama3.2:latest';
  }

  static getSystemPrompt() {
    return getSetting('system_prompt') || 'Du bist Max, ein persönlicher, empathischer und kluger digitaler Begleiter. Antworte auf Deutsch, präzise und hilfsbereit.';
  }

  static getTemperature() {
    const t = parseFloat(getSetting('temperature'));
    return isNaN(t) ? 0.7 : t;
  }

  /**
   * Candidate URLs to test if standard configured URL fails
   */
  static getCandidateUrls(customUrl) {
    const configured = customUrl || this.getBaseUrl();
    const list = [configured];

    const alternatives = [
      'http://127.0.0.1:11434',
      'http://localhost:11434',
      'http://172.17.0.1:11434',
      'http://host.docker.internal:11434',
    ];

    for (const alt of alternatives) {
      if (!list.includes(alt)) {
        list.push(alt);
      }
    }
    return list;
  }

  /**
   * Check status and fetch models from Ollama
   * @param {string} [specificUrl] - optional URL to test specifically
   */
  static async checkStatus(specificUrl) {
    const candidateUrls = this.getCandidateUrls(specificUrl);
    let lastError = null;

    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const res = await fetch(`${url}/api/tags`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const models = (data.models || []).map((m) => ({
            name: m.name,
            size: m.size,
            modified_at: m.modified_at,
          }));

          const currentModel = this.getModel();
          const modelAvailable = models.some(
            (m) => m.name === currentModel || m.name.startsWith(currentModel)
          );

          return {
            connected: true,
            baseUrl: url,
            currentModel,
            modelAvailable,
            models,
          };
        }
      } catch (err) {
        lastError = err;
      }
    }

    const primaryUrl = specificUrl || this.getBaseUrl();
    let errorMsg = `Ollama ist unter ${primaryUrl} nicht erreichbar.`;
    if (lastError?.code === 'ECONNREFUSED' || lastError?.message?.includes('fetch failed')) {
      errorMsg = `Keine Verbindung zu Ollama (${primaryUrl}). Bitte stelle sicher, dass der Ollama-Dienst läuft.`;
    }

    return {
      connected: false,
      baseUrl: primaryUrl,
      currentModel: this.getModel(),
      modelAvailable: false,
      error: errorMsg,
      models: [],
    };
  }

  /**
   * Stream a chat completion with Ollama
   */
  static async streamChat(messages, onChunk) {
    const status = await this.checkStatus();
    const baseUrl = status.connected ? status.baseUrl : this.getBaseUrl();
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
      buffer = lines.pop();

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
        } catch (e) {}
      }
    }
  }

  /**
   * Generate a non-streaming completion for memory processing
   */
  static async generate(prompt, formatJson = false) {
    const status = await this.checkStatus();
    const baseUrl = status.connected ? status.baseUrl : this.getBaseUrl();
    const model = this.getModel();

    const body = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,
      },
    };

    if (formatJson) {
      body.format = 'json';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

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
