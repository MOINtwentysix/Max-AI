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
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-surface/90 backdrop-blur-lg border-t border-border transition-colors">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-2xl transition-all duration-200 relative ${
                isActive
                  ? 'text-accent font-semibold'
                  : 'text-muted hover:text-main'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-accent/10 scale-105' : 'hover:bg-subtle'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
