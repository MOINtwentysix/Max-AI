import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MaxMascot } from '../components/MaxMascot';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export function ChatView({ onThinkingChange }) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Notify parent of thinking state
  useEffect(() => {
    onThinkingChange?.(isStreaming);
  }, [isStreaming, onThinkingChange]);

  // Check Ollama status on mount
  useEffect(() => {
    async function checkOllama() {
      try {
        const res = await fetch('/api/chat/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setOllamaStatus(data);
        if (!data.connected) {
          setError(data.error || 'Ollama ist aktuell nicht erreichbar.');
        }
      } catch (err) {
        setError('Ollama-Verbindungsprüfung fehlgeschlagen.');
      }
    }
    if (token) checkOllama();
  }, [token]);

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

    // Placeholder for Max's incoming streaming message
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
            if (data.error) {
              throw new Error(data.error);
            }
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
            if (data.done) {
              break;
            }
          } catch (pe) {
            if (pe.message && !pe.message.includes('JSON')) {
              throw pe;
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Verbindung zu Max unterbrochen.');
      // Remove empty placeholder if failed immediately
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
    <div className="flex flex-col h-[calc(100vh-4.5rem-4rem)] max-w-2xl mx-auto w-full px-4 pt-3 pb-2">
      {/* Offline / Error Alert */}
      {error && (
        <div className="mb-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-3 text-red-700 dark:text-red-300 shadow-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div className="flex-1 text-xs md:text-sm">
            <p className="font-semibold">Ollama nicht erreichbar</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
          <button
            onClick={() => {
              setError(null);
              fetch('/api/chat/status', { headers: { Authorization: `Bearer ${token}` } })
                .then((r) => r.json())
                .then((d) => setOllamaStatus(d));
            }}
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-300"
            title="Erneut prüfen"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted">
            <div className="p-4 rounded-3xl bg-subtle/80 mb-4 shadow-sm border border-border">
              <MaxMascot size={64} color={user?.avatar_color || '#3B82F6'} />
            </div>
            <h2 className="text-xl font-bold text-main mb-1">
              Hi {user?.username}, ich bin Max!
            </h2>
            <p className="text-sm max-w-sm mb-6 leading-relaxed">
              Dein persönlicher KI-Begleiter. Erzähle mir von deinen Gedanken, Projekten oder frage mich alles Mögliche.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md text-left">
              {[
                '👋 Stell dich kurz vor',
                '💡 Was kannst du dir über mich merken?',
                '🚀 Hilf mir bei einem Programmierprojekt',
                '☕ Was ist dein Lieblingskaffee?',
              ].map((starter, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(starter.replace(/^[^\s]+\s/, ''));
                    inputRef.current?.focus();
                  }}
                  className="p-3 rounded-2xl bg-surface hover:bg-subtle border border-border text-xs text-main font-medium shadow-sm transition-all hover:scale-[1.02] flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>{starter}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-subtle flex-shrink-0 flex items-center justify-center self-end mb-1 border border-border">
                    <MaxMascot size={22} color={user?.avatar_color || '#3B82F6'} />
                  </div>
                )}
                <div
                  className={`relative max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-3xl shadow-sm transition-all ${
                    isUser
                      ? 'bg-slate-900 text-white dark:bg-blue-600 rounded-br-sm'
                      : 'bg-subtle text-main border border-border/60 rounded-bl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm md:text-[0.9375rem] whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  ) : msg.content ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    <div className="flex items-center gap-2 py-1 text-muted text-sm">
                      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
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

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        className="relative bg-surface rounded-3xl border border-border shadow-md transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nachricht an Max..."
          rows={1}
          disabled={isStreaming}
          className="w-full pl-5 pr-14 py-3.5 text-sm md:text-base bg-transparent resize-none outline-none text-main placeholder:text-muted max-h-32 disabled:opacity-60"
          style={{ minHeight: '52px' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-accent text-white shadow hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all"
          title="Senden"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
