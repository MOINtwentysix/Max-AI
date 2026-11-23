import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Send, Compass, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export function ChatView({ messages = [], setMessages }) {
  const { user, token } = useAuth();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Live Queue state
  // queueState: null | { position: number, total: number }
  const [queueState, setQueueState] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, queueState]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || isStreaming) return;

    const userMsg = { role: 'user', content: cleanInput };
    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);
    setQueueState(null);

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
        throw new Error(errJson.error || 'Server-Fehler');
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

            // Live Queue updates
            if (data.type === 'queue') {
              if (data.position > 0) {
                setQueueState({ position: data.position, total: data.total });
              } else {
                // position 0 means active now!
                setQueueState(null);
              }
              continue;
            }

            if (data.error) throw new Error(data.error);

            if (data.chunk) {
              setQueueState(null); // cleared once generation starts
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
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantMsgIndex] = {
          role: 'assistant',
          content: 'Ich konnte gerade keine Antwort generieren. Bitte versuche es gleich noch einmal.',
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setQueueState(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine user display name: Prefer first_name if configured!
  const displayName = user?.first_name || user?.username || 'Freund';

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-2xl mx-auto w-full px-4 pb-20 md:pb-6 justify-between">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pt-2 pb-4 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-end pb-6 space-y-3">
            {/* Muse Welcome Pill Bubble */}
            <div className="max-w-[85%] bg-[#eeeff2] dark:bg-[#1c1c1f] text-[#1d1d1f] dark:text-[#f5f5f7] p-5 rounded-[26px] rounded-bl-md text-sm leading-relaxed shadow-sm">
              <p className="font-semibold text-base">
                Hi {displayName}! Ich bin Max.
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                Dein persönlicher Begleiter. Alles Wichtige über dich lerne ich im Gespräch und behalte es in meinem <b>Max LTM</b> (Long Time Memory).
              </p>
            </div>

            {/* Muse Example Rich Card */}
            <div className="max-w-[92%] muse-card rounded-[26px] p-5 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-muted">
                <Compass className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-main uppercase tracking-wider text-[10px]">
                  Vorschlag für deinen Tag
                </span>
              </div>
              <p className="text-main leading-relaxed">
                Erzähle mir von deinen Gedanken, plane deinen Tag oder frage mich alles Mögliche.
              </p>
              <div className="flex gap-2 pt-1 overflow-x-auto no-scrollbar">
                {[
                  'Was kannst du dir über mich merken?',
                  'Hilf mir bei einer Idee',
                  'Wie funktioniert mein Max LTM?',
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(s);
                      inputRef.current?.focus();
                    }}
                    className="px-3.5 py-2 rounded-full bg-subtle hover:bg-black/5 dark:hover:bg-white/10 text-[11px] font-semibold text-main whitespace-nowrap transition-colors"
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
                  className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#1d1d1f] text-white dark:bg-amber-600 rounded-[26px] rounded-br-sm shadow-sm'
                      : 'bg-[#eeeff2] dark:bg-[#1c1c1f] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-[26px] rounded-bl-sm'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : msg.content ? (
                    <MarkdownRenderer content={msg.content} />
                  ) : (
                    /* Clean Thinking State without rotating mascot */
                    <div className="text-muted text-xs font-semibold tracking-wide py-0.5">
                      Max denkt...
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Live Queue Ray Card when multiple requests queue up */}
        {queueState && (
          <div className="muse-card rounded-[26px] p-5 border border-amber-500/20 shadow-lg space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-main">Anfrage-Warteschlange</span>
              </div>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                Platz {queueState.position} von {queueState.total}
              </span>
            </div>

            <p className="text-[11px] text-muted">
              Gerade antwortet Max auf eine andere Anfrage. Du bist gleich an der Reihe!
            </p>

            {/* Segmented Progress Ray / Strahl */}
            <div className="flex items-center gap-1.5 w-full pt-1">
              {Array.from({ length: queueState.total }).map((_, i) => {
                // If segment index is before or equal to progress from total - position
                const completedSegments = queueState.total - queueState.position;
                const isDone = i <= completedSegments;
                const isCurrent = i === completedSegments;

                return (
                  <div
                    key={i}
                    className={`h-2.5 flex-1 rounded-full transition-all duration-500 ${
                      isCurrent
                        ? 'bg-amber-500 animate-pulse'
                        : isDone
                        ? 'bg-amber-500'
                        : 'bg-subtle/80 border border-border'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Pill Input Bar (Always stays fixed at the bottom above navigation) */}
      <div className="pt-2 sticky bottom-0 z-20 bg-gradient-to-t from-primary via-primary to-transparent pb-1">
        <form
          onSubmit={handleSend}
          className="muse-pill rounded-full p-2 flex items-center gap-2 shadow-lg transition-all"
        >
          <button
            type="button"
            onClick={() => {
              setInput((prev) => (prev ? prev + ' ' : ''));
              inputRef.current?.focus();
            }}
            className="w-10 h-10 rounded-full bg-subtle/80 hover:bg-subtle text-muted hover:text-main flex items-center justify-center transition-colors flex-shrink-0"
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
            className="flex-1 bg-transparent border-none outline-none text-sm text-main placeholder:text-muted/70 px-2 disabled:opacity-50 font-medium"
          />

          {input.trim() ? (
            <button
              type="submit"
              disabled={isStreaming}
              className="w-10 h-10 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              className="w-10 h-10 rounded-full text-muted hover:text-main flex items-center justify-center transition-colors flex-shrink-0"
              title="Sprachaufnahme"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
