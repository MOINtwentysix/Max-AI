import React, { useState, useEffect } from 'react';

/**
 * Muse-Style Companion Mascot
 * Organic, adorable character inspired by the Muse reference:
 * - Soft pill / pebble body shape
 * - Two expressive round eyes + warm smile
 * - Tilts sideways and thinks with animated thought bubbles
 */
export function MaxMascot({ size = 44, color = '#E8D5C4', isThinking = false, className = '' }) {
  const [thoughtStage, setThoughtStage] = useState(0);

  useEffect(() => {
    if (!isThinking) {
      setThoughtStage(0);
      return;
    }
    const interval = setInterval(() => {
      setThoughtStage((prev) => (prev + 1) % 3);
    }, 600);
    return () => clearInterval(interval);
  }, [isThinking]);

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Soft Mascot Pebble Body */}
      <div
        className={`transition-all duration-400 ease-out flex items-center justify-center ${
          isThinking ? 'thinking-mascot' : 'hover:scale-105 active:scale-95'
        }`}
        style={{
          width: size,
          height: size * 1.12,
        }}
      >
        <svg
          viewBox="0 0 100 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            {/* Clay / Pebble Soft 3D Lighting Gradient */}
            <linearGradient id="museClayGrad" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#F9EDE2" />
              <stop offset="60%" stopColor="#E5CEB9" />
              <stop offset="100%" stopColor="#C9AB92" />
            </linearGradient>
            <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF9B9B" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FF9B9B" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Organic Pebble Body */}
          <path
            d="M 50 8 
               C 74 8, 88 28, 88 56 
               C 88 84, 76 104, 50 104 
               C 24 104, 12 84, 12 56 
               C 12 28, 26 8, 50 8 Z"
            fill="url(#museClayGrad)"
          />

          {/* Subtle Clay highlight at top */}
          <ellipse cx="50" cy="18" rx="22" ry="7" fill="#FFFFFF" fillOpacity="0.4" />

          {/* Left Eye */}
          <circle cx="41" cy="50" r="3.6" fill="#2E241E" />
          <circle cx="42.2" cy="48.8" r="1.3" fill="#FFFFFF" />

          {/* Right Eye */}
          <circle cx="59" cy="50" r="3.6" fill="#2E241E" />
          <circle cx="60.2" cy="48.8" r="1.3" fill="#FFFFFF" />

          {/* Cute subtle smile */}
          <path
            d="M 47 58 Q 50 62 53 58"
            stroke="#4A3B32"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />

          {/* Cheerful blush */}
          <circle cx="34" cy="55" r="5" fill="url(#blushGrad)" />
          <circle cx="66" cy="55" r="5" fill="url(#blushGrad)" />
        </svg>
      </div>

      {/* Muse-Style Floating Thought Indicator */}
      {isThinking && (
        <div className="absolute left-[95%] top-1/2 -translate-y-1/2 pl-2 z-30 pointer-events-none">
          <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-md border border-black/5 dark:border-white/10 flex items-center gap-1">
            {thoughtStage === 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
            )}
            {thoughtStage === 1 && (
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
              </div>
            )}
            {thoughtStage === 2 && (
              <div className="thought-bubble-anim flex items-center text-amber-500">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
