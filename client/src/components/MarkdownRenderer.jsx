import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Lightweight Markdown & Code Renderer:
 * - Bold, italic, headings, lists, inline code
 * - Fenced code blocks with language tag and quick copy button
 */
export function MarkdownRenderer({ content = '' }) {
  const parts = splitCodeBlocks(content);

  return (
    <div className="prose-max space-y-2 break-words">
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return <CodeBlock key={index} code={part.code} lang={part.lang} />;
        }
        return <FormattedText key={index} text={part.text} />;
      })}
    </div>
  );
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-border bg-[#0d1117] text-slate-100 shadow-sm">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] text-xs text-slate-400 font-mono border-b border-white/5">
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
          title="Code kopieren"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Kopiert</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Kopieren</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 text-xs md:text-sm font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function splitCodeBlocks(text) {
  const result = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    result.push({
      type: 'code',
      lang: match[1] || '',
      code: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    result.push({ type: 'text', text: text.slice(lastIndex) });
  }

  return result;
}

function FormattedText({ text }) {
  if (!text) return null;

  // Split into paragraphs by double newlines
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const lines = p.split('\n');

        // Check if paragraph is an unordered list
        if (lines.every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '))) {
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>{renderInline(l.replace(/^[-*]\s+/, ''))}</li>
              ))}
            </ul>
          );
        }

        // Check for numbered list
        if (lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>{renderInline(l.replace(/^\d+\.\s+/, ''))}</li>
              ))}
            </ol>
          );
        }

        // Check for heading
        if (p.startsWith('### ')) {
          return <h3 key={pIdx} className="text-base font-semibold text-main pt-1">{renderInline(p.slice(4))}</h3>;
        }
        if (p.startsWith('## ')) {
          return <h2 key={pIdx} className="text-lg font-bold text-main pt-1.5">{renderInline(p.slice(3))}</h2>;
        }
        if (p.startsWith('# ')) {
          return <h1 key={pIdx} className="text-xl font-extrabold text-main pt-2">{renderInline(p.slice(2))}</h1>;
        }

        // Regular paragraph with potential single line breaks
        return (
          <p key={pIdx}>
            {lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {renderInline(line)}
                {lineIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function renderInline(str) {
  // Parse inline bold (**bold**), italic (*italic*), and inline code (`code`)
  const parts = [];
  let buffer = '';
  let i = 0;

  while (i < str.length) {
    // Inline code `...`
    if (str[i] === '`') {
      const closeIdx = str.indexOf('`', i + 1);
      if (closeIdx !== -1) {
        if (buffer) parts.push(buffer);
        buffer = '';
        parts.push(
          <code key={i} className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-accent font-mono text-[0.88em]">
            {str.slice(i + 1, closeIdx)}
          </code>
        );
        i = closeIdx + 1;
        continue;
      }
    }

    // Bold **...**
    if (str.startsWith('**', i)) {
      const closeIdx = str.indexOf('**', i + 2);
      if (closeIdx !== -1) {
        if (buffer) parts.push(buffer);
        buffer = '';
        parts.push(
          <strong key={i} className="font-semibold text-main">
            {str.slice(i + 2, closeIdx)}
          </strong>
        );
        i = closeIdx + 2;
        continue;
      }
    }

    // Italic *...*
    if (str[i] === '*' && str[i + 1] !== '*') {
      const closeIdx = str.indexOf('*', i + 1);
      if (closeIdx !== -1) {
        if (buffer) parts.push(buffer);
        buffer = '';
        parts.push(
          <em key={i} className="italic">
            {str.slice(i + 1, closeIdx)}
          </em>
        );
        i = closeIdx + 1;
        continue;
      }
    }

    buffer += str[i];
    i++;
  }

  if (buffer) parts.push(buffer);
  return parts;
}
