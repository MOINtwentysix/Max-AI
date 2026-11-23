import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { ChatView } from './pages/ChatView';
import { MemoryView } from './pages/MemoryView';
import { ProfileView } from './pages/ProfileView';
import { AdminView } from './pages/AdminView';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('chat');
  const [isThinking, setIsThinking] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary text-muted text-sm font-medium">
        Max wird gestartet...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-primary">
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary text-main">
      {/* Top Header */}
      <Header isThinking={isThinking} />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'chat' && <ChatView onThinkingChange={setIsThinking} />}
        {activeTab === 'memory' && <MemoryView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'admin' && user?.role === 'ADMIN' && <AdminView />}
      </main>

      {/* Dynamic Bottom Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
