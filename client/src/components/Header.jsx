import React from 'react';
import { MaxMascot } from './MaxMascot';
import { Menu, Sun, Moon, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ isThinking = false, onToggleMenu }) {
  const { user, theme, toggleTheme, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/85 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-18 flex items-center justify-between">
        {/* Left Menu / Theme Switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-subtle text-muted hover:text-main transition-colors"
            title={theme === 'dark' ? 'Zu Light Mode wechseln' : 'Zu Dark Mode wechseln'}
            aria-label="Theme umschalten"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Center: Rounded Max Profile & Name */}
        <div className="flex flex-col items-center justify-center -translate-y-0.5">
          <div className="p-1 rounded-full bg-subtle/80 hover:bg-subtle transition-all cursor-pointer">
            <MaxMascot
              size={42}
              color={user?.avatar_color || '#3B82F6'}
              isThinking={isThinking}
            />
          </div>
          <span className="text-xs font-semibold tracking-wide text-main mt-0.5">
            Max
          </span>
        </div>

        {/* Right: Quick Logout or Status */}
        <div className="flex items-center gap-1">
          <button
            onClick={logout}
            className="p-2.5 rounded-full hover:bg-subtle text-muted hover:text-red-500 transition-colors"
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
