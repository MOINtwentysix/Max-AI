import React from 'react';
import { MessageSquare, Brain, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MaxMascot } from './MaxMascot';

export function Navigation({ activeTab, setActiveTab }) {
  const { isAdmin } = useAuth();

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'memory', label: 'Max LTM', icon: Brain },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP / IPAD HORIZONTAL SIDEBAR (LEFT)              */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col justify-between w-64 h-screen fixed left-0 top-0 bg-surface/90 backdrop-blur-xl border-r border-border p-6 z-40 select-none">
        <div className="space-y-6">
          {/* Logo & Max Badge */}
          <div className="flex items-center gap-3.5 px-2">
            <MaxMascot size={46} />
            <div>
              <span className="font-extrabold text-base text-main tracking-tight block leading-tight">
                Max
              </span>
              <span className="text-[11px] font-semibold text-muted">
                Personal AI Buddy
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-md shadow-black/5 scale-[1.02]'
                      : 'text-muted hover:text-main hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="px-2 pt-4 border-t border-border/60 text-[11px] text-muted">
          <span>Max v1.2 • PWA Ready</span>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. MOBILE BOTTOM FLOATING NAVIGATION PILL                */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-5 left-0 right-0 z-30 pointer-events-none select-none">
        <div className="max-w-xs mx-auto px-2 pointer-events-auto">
          <div className="muse-pill rounded-full p-1.5 flex items-center justify-around gap-1 shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 ${
                    isActive
                      ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-sm'
                      : 'text-muted hover:text-main hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
