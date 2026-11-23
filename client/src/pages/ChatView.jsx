import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Send, AlertCircle, RefreshCw, Compass, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export function ChatView({ onThinkingChange }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    onThinkingChange?.(isStreaming);
  }, [isStreaming, onThinkingChange]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || isStreaming) return;

    setError(null);
    const userMsg = { role: 'user', content: cleanInput };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    const assistantMsgIndex = newMessages.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${response.status}: Server-Fehler`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.replace('data: ', '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.error) throw new Error(data.error);
            if (data.chunk) {
              accumulatedText += data.chunk;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantMsgIndex] = {
                  role: 'assistant',
                  content: accumulatedText,
                };
                return updated;
              });
            }
            if (data.done) break;
          } catch (pe) {
            if (pe.message && !pe.message.includes('JSON')) throw pe;
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Verbindung zu Max unterbrochen.');
      setMessages((prev) => {
        if (prev[assistantMsgIndex]?.content === '') {
          return prev.slice(0, assistantMsgIndex);
        }
        return prev;
      });
    } finally {
      setIsStreaming(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-md mx-auto w-full px-4 pb-20 justify-between">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pt-2 pb-4 no-scrollbar">
        {error && (
          <div className="p-4 rounded-3xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="flex-1">
              <p className="font-semibold">Ollama Hinweis</p>
              <p className="mt-0.5 opacity-90 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="p-1 rounded-full hover:bg-black/5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-end pb-6 space-y-3">
            {/* Muse Welcome Pill Bubble */}
            <div className="max-w-[85%] bg-[#eeeff2] dark:bg-[#1c1c1f] text-[#1d1d1f] dark:text-[#f5f5f7] p-4 rounded-[26px] rounded-bl-md text-sm leading-relaxed shadow-sm">
              <p className="font-medium">
                Hi {user?.username}! Ich bin Max, dein persönlicher digitaler Begleiter.
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Ich lerne dich mit jedem Gespräch besser kennen und merke mir wichtige Dinge in meinem lokalen Gedächtnis. Was steht heute an?
              </p>
            </div>

            {/* Muse Example Rich Card (Itinerary Style) */}
            <div className="max-w-[92%] muse-card rounded-[26px] p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-muted">
                <Compass className="w-4 h-4 text-accent" />
                <span className="font-semibold text-main uppercase tracking-wider text-[10px]">
                  Vorschlag für deinen Tag
                </span>
              </div>
              <p className="text-main leading-relaxed">
                Du kannst mit mir über deine Projekte sprechen, Notizen festhalten oder Ideen brainstormen.
              </p>
              <div className="flex gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                {[
                  'Was kannst du dir merken?',
                  'Hilf mir bei einer Idee',
                  'Fasse meine Gedanken zusammen',
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                    className="px-3 py-1.5 rounded-full bg-subtle hover:bg-black/5 dark:hover:bg-white/10 text-[11px] font-medium text-main whitespace-nowrap transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#1d1d1f] text-white dark:bg-blue-600 rounded-[24px] rounded-br-sm shadow-sm'
                      : 'bg-[#eeeff2] dark:bg-[#1c1c1f] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-[24px] rounded-bl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.content ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-muted text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                      <span>Max denkt nach...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Muse Minimalist Floating Pill Input Box */}
      <form
        onSubmit={handleSend}
        className="muse-pill rounded-full p-2 flex items-center gap-2 transition-all"
      >
        <button
          type="button"
          onClick={() => {
            setInput((prev) => (prev ? prev + ' ' : ''));
            inputRef.current?.focus();
          }}
          className="w-9 h-9 rounded-full bg-subtle/80 hover:bg-subtle text-muted hover:text-main flex items-center justify-center transition-colors flex-shrink-0"
          title="Optionen"
        >
          <Plus className="w-4 h-4" />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message"
          disabled={isStreaming}
          className="flex-1 bg-transparent border-none outline-none text-sm text-main placeholder:text-muted/70 px-1 disabled:opacity-50"
        />

        {input.trim() ? (
          <button
            type="submit"
            disabled={isStreaming}
            className="w-9 h-9 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        ) : (
          <button
            type="button"
            className="w-9 h-9 rounded-full text-muted hover:text-main flex items-center justify-center transition-colors flex-shrink-0"
            title="Sprachaufnahme"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
}
