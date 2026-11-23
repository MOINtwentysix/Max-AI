import React, { useState, useEffect } from 'react';
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

  // Persistent session chat state in React state:
  // Chat stays intact until user explicitly clicks "Neuer Chat" in the header!
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('max_session_chat');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('max_session_chat', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  const handleStartNewChat = () => {
    if (messages.length > 0) {
      if (confirm('Möchtest du wirklich einen neuen Chat starten?')) {
        setMessages([]);
        sessionStorage.removeItem('max_session_chat');
      }
    }
  };

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
    <div className="min-h-screen flex flex-col md:pl-64 bg-primary text-main transition-all">
      {/* Top Header */}
      <Header onNewChat={handleStartNewChat} />

      {/* Main Tab Content */}
      <main className="flex-1 flex flex-col w-full">
        {activeTab === 'chat' && (
          <ChatView messages={messages} setMessages={setMessages} />
        )}
        {activeTab === 'memory' && <MemoryView />}
        {activeTab === 'profile' && <ProfileView />}
        {activeTab === 'admin' && user?.role === 'ADMIN' && <AdminView />}
      </main>

      {/* Navigation (Left Sidebar on Desktop, Floating Bottom Pill on Mobile) */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
