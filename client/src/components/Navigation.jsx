import React from 'react';
import { MessageSquare, Brain, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Navigation({ activeTab, setActiveTab }) {
  const { isAdmin } = useAuth();

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'memory', label: 'Memory', icon: Brain },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  if (isAdmin) {
    tabs.push({ id: 'admin', label: 'Admin', icon: Shield });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/85 backdrop-blur-xl border-t border-border transition-colors">
      <div className="max-w-md mx-auto px-4 h-18 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-2xl transition-all duration-300 relative select-none ${
                isActive
                  ? 'text-accent font-semibold scale-105'
                  : 'text-muted hover:text-main hover:scale-102'
              }`}
            >
              <div
                className={`p-1.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-accent/15 text-accent shadow-sm'
                    : 'hover:bg-subtle/80'
                }`}
              >
                <Icon className="w-5 h-5 transition-transform duration-200" />
              </div>
              <span className="text-[11px] mt-1 tracking-tight font-medium">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-accent transition-all duration-300" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
