import React from 'react';
import { MaxMascot } from './MaxMascot';
import { Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ isThinking = false }) {
  const { user, theme, toggleTheme, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-xl border-b border-border transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Left: Theme Switcher */}
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl hover:bg-subtle text-muted hover:text-main border border-transparent hover:border-border transition-all duration-200 active:scale-95"
            title={theme === 'dark' ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
            aria-label="Theme umschalten"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        </div>

        {/* Center: Max Mascot & Name */}
        <div className="flex flex-col items-center justify-center cursor-default">
          <div className="p-1.5 rounded-full bg-subtle/60 border border-border/60 transition-transform duration-300 hover:scale-105 shadow-sm">
            <MaxMascot
              size={46}
              color={user?.avatar_color || '#3B82F6'}
              isThinking={isThinking}
            />
          </div>
          <span className="text-xs font-bold tracking-wider text-main mt-1 uppercase">
            Max
          </span>
        </div>

        {/* Right: Logout */}
        <div className="flex items-center">
          <button
            onClick={logout}
            className="p-2.5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/40 text-muted hover:text-red-500 border border-transparent hover:border-red-200 dark:hover:border-red-900 transition-all duration-200 active:scale-95"
            title="Abmelden"
            aria-label="Abmelden"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
