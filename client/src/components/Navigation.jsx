import React from 'react';
import { MessageSquare, Brain, User, Shield, CheckSquare, Grid } from 'lucide-react';
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
    <nav className="fixed bottom-5 left-0 right-0 z-30 pointer-events-none select-none">
      <div className="max-w-xs mx-auto px-2 pointer-events-auto">
        <div className="muse-pill rounded-full p-1.5 flex items-center justify-around gap-1">
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
  );
}
