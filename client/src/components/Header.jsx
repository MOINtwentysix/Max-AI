import React from 'react';
import { MaxMascot } from './MaxMascot';
import { Menu, Sun, Moon, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ isThinking = false, onToggleMenu }) {
  const { user, theme, toggleTheme, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full pt-3 pb-2 px-4 bg-transparent select-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: Floating Circular Menu Button (like Muse reference) */}
        <button
          onClick={toggleTheme}
          className="w-11 h-11 rounded-full muse-pill flex items-center justify-center text-muted hover:text-main active:scale-95 transition-all"
          title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Menu className="w-5 h-5 text-[#1d1d1f]" />
          )}
        </button>

        {/* Center: Muse-Style Floating Pill with Mascot & Name */}
        <div className="flex flex-col items-center">
          <div className="px-4 py-1.5 rounded-full muse-pill flex flex-col items-center justify-center -space-y-0.5 cursor-default hover:scale-[1.02] transition-transform">
            <MaxMascot size={32} isThinking={isThinking} />
            <span className="text-[12px] font-semibold text-main tracking-tight pt-0.5">
              Max
            </span>
          </div>
        </div>

        {/* Right: Floating Pill Action Button ("Invite" / Status) */}
        <button
          onClick={logout}
          className="h-11 px-4 rounded-full muse-pill flex items-center justify-center gap-1.5 text-[13px] font-semibold text-main hover:text-red-500 active:scale-95 transition-all"
          title="Abmelden"
        >
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}
