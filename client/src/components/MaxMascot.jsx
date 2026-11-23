import React, { useState, useEffect } from 'react';

/**
 * MaxMascot:
 * - Abstract boomerang shaped mascot with 2 expressive eyes
 * - Supports custom colors (via avatar_color prop)
 * - Animated thinking state: tilts sideways with an animated thinking GIF/SVG loop
 *   (cycling between 1 dot, 2 dots, and a thought bubble)
 */
export function MaxMascot({ size = 48, color = '#3B82F6', isThinking = false, className = '' }) {
  const [thoughtStage, setThoughtStage] = useState(0); // 0: 1 dot, 1: 2 dots, 2: thought bubble

  useEffect(() => {
    if (!isThinking) {
      setThoughtStage(0);
      return;
    }
    const interval = setInterval(() => {
      setThoughtStage((prev) => (prev + 1) % 3);
    }, 700);
    return () => clearInterval(interval);
  }, [isThinking]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Mascot Body */}
      <div
        className={`transition-all duration-500 ease-out flex items-center justify-center ${
          isThinking ? 'thinking-mascot' : ''
        }`}
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id={`grad-${color}`} x1="15%" y1="15%" x2="85%" y2="85%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={adjustColor(color, -25)} />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={color} floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Boomerang Shape */}
          <path
            d="M 22 28 C 36 12, 64 12, 78 28 C 88 38, 90 56, 76 72 C 64 86, 44 86, 32 74 C 24 64, 24 48, 36 40 C 44 34, 56 36, 62 44 C 66 50, 64 58, 56 62 C 50 64, 44 60, 42 54"
            stroke={`url(#grad-${color})`}
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softGlow)"
          />

          {/* Inquisitive Eyes */}
          <circle cx="48" cy="45" r="4.5" fill="#0F172A" />
          <circle cx="62" cy="47" r="4.5" fill="#0F172A" />
          {/* Eye highlights */}
          <circle cx="49.5" cy="43.5" r="1.6" fill="#FFFFFF" />
          <circle cx="63.5" cy="45.5" r="1.6" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Thinking Loop Animation Displayed to the right of Max */}
      {isThinking && (
        <div
          className="absolute left-[92%] top-1/2 -translate-y-1/2 flex items-center pl-1 pointer-events-none z-10"
          style={{ height: size * 0.7 }}
        >
          <div className="bg-surface/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-border shadow-md flex items-center justify-center gap-1.5 transition-all">
            {thoughtStage === 0 && (
              <span className="w-2 h-2 rounded-full bg-accent animate-ping inline-block" />
            )}
            {thoughtStage === 1 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent/70" />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce" />
              </div>
            )}
            {thoughtStage === 2 && (
              <div className="thought-bubble-anim flex items-center gap-1 text-accent">
                {/* SVG Thought Bubble */}
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to lighten/darken hex colors for realistic gradient
function adjustColor(col, amt) {
  let usePound = false;
  if (col[0] === '#') {
    col = col.slice(1);
    usePound = true;
  }
  let num = parseInt(col, 16);
  let r = (num >> 16) + amt;
  if (r > 255) r = 255;
  else if (r < 0) r = 0;
  let b = ((num >> 8) & 0x00ff) + amt;
  if (b > 255) b = 255;
  else if (b < 0) b = 0;
  let g = (num & 0x0000ff) + amt;
  if (g > 255) g = 255;
  else if (g < 0) g = 0;
  return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
}
