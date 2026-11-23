import { OllamaService } from './ollamaService.js';
import { MemoryService } from './memoryService.js';
import { db } from '../db.js';

export class MemoryProcessingService {
  /**
   * Process a completed turn (user message + assistant response) asynchronously in Path B
   */
  static async processTurnAsync(userId, userMessage, assistantResponse) {
    try {
      console.log(`[MemoryProcessor] Starting Path B memory extraction for user ${userId}...`);

      // 1. Fetch current memories for context (so LLM can detect UPDATE or DELETE vs CREATE)
      const existingMemories = db.prepare(`
        SELECT id, content, category, origin 
        FROM memories 
        WHERE user_id = ? 
        ORDER BY updated_at DESC 
        LIMIT 30
      `).all(userId);

      const existingContextStr = existingMemories.length > 0
        ? existingMemories.map((m) => `ID: ${m.id} | Kategorie: ${m.category} | Herkunft: ${m.origin} | Inhalt: ${m.content}`).join('\n')
        : '(Keine bisherigen Erinnerungen vorhanden)';

      const prompt = `
Du bist das hochpräzise Gedächtnis-System ("Memory Processor") von Max, dem persönlichen KI-Begleiter.
Deine Aufgabe ist es, die folgende Interaktion zwischen dem Nutzer und Max zu analysieren und zu entscheiden, ob dauerhaft relevante Fakten, Präferenzen, Projekte, Personen oder Interessen gelernt, aktualisiert oder gelöscht werden müssen.

### Regeln für das Gedächtnis:
1. Relevanz: Speichere NUR wichtige Fakten, Vorlieben, Namen, Ziele, Interessen oder Projekte des Nutzers. Kein belangloser Smalltalk ("Hallo", "Wie gehts?").
2. Herkunft (origin):
   - "USER_STATEMENT": Der Nutzer hat dies direkt über sich oder seine Welt gesagt (z.B. "Ich heiße Alex", "Ich trinke gern Espresso", "Ich lerne Python").
   - "MAX_INFERRED": Max hat etwas vorgeschlagen, geschlussfolgert oder vermutet, und der Nutzer hat zugestimmt oder es ist ein relevanter Kontextvorschlag.
3. Kategorien:
   - "Persönliches" (Name, Geburtstag, Wohnort, Familie, Beruf)
   - "Interessen" (Hobbys, Musik, Sport, Reisen)
   - "Projekte" (Aktuelle Programmierprojekte, Hausbau, Geschäftsideen)
   - "Personen" (Freunde, Partner, Kollegen, Haustiere)
   - "Vorlieben" (Lieblingsessen, Tools, Arbeitsweisen)
   - "Wissen" (Spezifische Fakten oder Notizen, die der Nutzer festhalten will)
   - "Sonstiges"
4. Aktionen:
   - "CREATE": Eine neue Tatsache, die noch nicht in den bisherigen Erinnerungen steht.
   - "UPDATE": Wenn eine bestehende Erinnerung (mit ID) korrigiert, erweitert oder geändert wurde (z.B. "Ich bin umgezogen nach Berlin").
   - "DELETE": Wenn eine Information veraltet oder widerrufen wurde (z.B. "Ich benutze kein Mac mehr").
   - "NONE": Wenn die Konversation keine neuen speicherwürdigen Fakten enthält.

### Bisherige Erinnerungen des Nutzers:
${existingContextStr}

### Aktuelle Interaktion:
Nutzer: """${userMessage}"""
Max: """${assistantResponse}"""

### Ausgabe-Format:
Gib AUSSCHLIESSLICH ein gültiges JSON-Objekt zurück im folgenden Format (ohne Markdown, ohne Text davor/danach):
{
  "actions": [
    {
      "action": "CREATE",
      "content": "Kurze, prägnante Formulierung des Fakts in 3. Person oder neutral (z.B. 'Trinkt morgens immer Espresso')",
      "category": "Vorlieben",
      "origin": "USER_STATEMENT",
      "confidence": 0.95
    },
    {
      "action": "UPDATE",
      "memory_id": "id-der-bestehenden-erinnerung",
      "content": "Aktualisierter Inhalt",
      "category": "Projekte",
      "confidence": 0.9
    },
    {
      "action": "DELETE",
      "memory_id": "id-der-zu-loeschenden-erinnerung",
      "reason": "Vom Nutzer widerrufen"
    }
  ]
}
Wenn nichts gespeichert werden soll, gib: {"actions": []} zurück.
`;

      let rawResponse = '';
      try {
        rawResponse = await OllamaService.generate(prompt, true);
      } catch (ollamaErr) {
        console.warn('[MemoryProcessor] Ollama call failed (Path B skipped):', ollamaErr.message);
        return;
      }

      if (!rawResponse) return;

      // Clean JSON string in case model wrapped it in markdown codeblocks
      let cleanJson = rawResponse.trim();
      if (cleanJson.startsWith('```json')) {
        cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        // Fallback: try finding first { and last }
        const first = cleanJson.indexOf('{');
        const last = cleanJson.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          parsed = JSON.parse(cleanJson.substring(first, last + 1));
        } else {
          console.warn('[MemoryProcessor] Could not parse JSON response:', cleanJson);
          return;
        }
      }

      const actions = parsed.actions || [];
      if (!Array.isArray(actions) || actions.length === 0) {
        console.log('[MemoryProcessor] No memory actions generated.');
        return;
      }

      for (const act of actions) {
        try {
          if (act.action === 'CREATE' && act.content && act.content.trim()) {
            MemoryService.createMemory(userId, {
              content: act.content,
              category: act.category,
              origin: act.origin || 'USER_STATEMENT',
              confidence: act.confidence || 0.9,
            });
            console.log(`[MemoryProcessor] CREATE memory: "${act.content}" (${act.category})`);
          } else if (act.action === 'UPDATE' && act.memory_id && act.content) {
            MemoryService.updateMemory(userId, act.memory_id, {
              content: act.content,
              category: act.category,
              confidence: act.confidence,
            });
            console.log(`[MemoryProcessor] UPDATE memory ${act.memory_id}`);
          } else if (act.action === 'DELETE' && act.memory_id) {
            MemoryService.deleteMemory(userId, act.memory_id);
            console.log(`[MemoryProcessor] DELETE memory ${act.memory_id}`);
          }
        } catch (actErr) {
          console.error(`[MemoryProcessor] Error executing memory action ${act.action}:`, actErr.message);
        }
      }
    } catch (err) {
      console.error('[MemoryProcessor] Error in Path B processing:', err);
    }
  }
}
