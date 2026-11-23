import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Cpu,
  Database,
  Lock,
  Unlock,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  Download,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminView() {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);

  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [regMode, setRegMode] = useState('PUBLIC');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [newCustomCode, setNewCustomCode] = useState('');

  const [aiSettings, setAiSettings] = useState({
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2:latest',
    systemPrompt: '',
    temperature: 0.7,
  });
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingAi, setTestingAi] = useState(false);

  const [backups, setBackups] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(data.users || []);
  };

  const loadRegistration = async () => {
    const res = await fetch('/api/admin/registration', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setRegMode(data.mode);
    setInviteCodes(data.inviteCodes || []);
  };

  const loadAi = async () => {
    const res = await fetch('/api/admin/ai', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAiSettings({
      baseUrl: data.baseUrl,
      model: data.model,
      systemPrompt: data.systemPrompt,
      temperature: data.temperature,
    });
  };

  const loadBackups = async () => {
    const res = await fetch('/api/admin/backups', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setBackups(data.backups || []);
  };

  const loadLogs = async () => {
    const res = await fetch('/api/admin/logs?limit=40', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setLogs(data.logs || []);
  };

  const handleSelectSection = (sec) => {
    setActiveSection(sec);
    if (sec === 'overview') loadOverview();
    if (sec === 'users') loadUsers();
    if (sec === 'registration') loadRegistration();
    if (sec === 'ai') loadAi();
    if (sec === 'system') loadBackups();
    if (sec === 'logs') loadLogs();
  };

  const handleTestConnection = async () => {
    try {
      setTestingAi(true);
      setTestResult(null);
      const res = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ connected: false, error: err.message });
    } finally {
      setTestingAi(false);
    }
  };

  const handleSaveAi = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(aiSettings),
      });
      const data = await res.json();
      setAiSaveSuccess(true);
      setTestResult(data.status);
      setTimeout(() => setAiSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.message);
    }
  };

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'ai', label: 'AI Backend' },
    { id: 'users', label: 'Users' },
    { id: 'registration', label: 'Registration' },
    { id: 'system', label: 'Backups' },
    { id: 'logs', label: 'Logs' },
  ];

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-2 pb-24 space-y-4">
      {/* Sub-nav pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelectSection(s.id)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-sm'
                : 'muse-pill text-muted hover:text-main'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="muse-card rounded-[24px] p-4">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Nutzer</span>
              <span className="text-xl font-bold text-main mt-1 block">{overview?.users?.total || 0}</span>
              <span className="text-[11px] text-emerald-500">{overview?.users?.active || 0} aktiv</span>
            </div>
            <div className="muse-card rounded-[24px] p-4">
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">Gedächtnis</span>
              <span className="text-xl font-bold text-main mt-1 block">{overview?.memories?.formattedTotal || '0 B'}</span>
              <span className="text-[11px] text-muted">{overview?.memories?.count || 0} Einträge</span>
            </div>
          </div>

          <div className="muse-card rounded-[24px] p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-main">Ollama Status</span>
              <span className={`font-bold flex items-center gap-1.5 ${overview?.ollama?.connected ? 'text-emerald-500' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${overview?.ollama?.connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {overview?.ollama?.connected ? 'Verbunden' : 'Nicht erreichbar'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted">
              URL: {overview?.ollama?.baseUrl} • Modell: {overview?.ollama?.currentModel}
            </p>
          </div>
        </div>
      )}

      {/* AI SETTINGS */}
      {activeSection === 'ai' && (
        <form onSubmit={handleSaveAi} className="muse-card rounded-[26px] p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-main tracking-tight">Ollama Anbindung</h3>
            <p className="text-[11px] text-muted mt-0.5">
              Gib die URL ein, unter der Ollama läuft (z.B. Host-IP oder Docker-Bridge).
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-main mb-1">Ollama URL</label>
            <input
              type="text"
              value={aiSettings.baseUrl}
              onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
              className="w-full p-2.5 rounded-2xl bg-subtle text-main font-mono outline-none"
            />
            <p className="text-[10px] text-muted mt-1">
              Tipp: Falls Ollama auf demselben Server läuft, teste <code>http://172.17.0.1:11434</code> oder <code>http://host.docker.internal:11434</code>.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-main mb-1">Modell</label>
            <input
              type="text"
              value={aiSettings.model}
              onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
              className="w-full p-2.5 rounded-2xl bg-subtle text-main font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-main mb-1">System-Prompt</label>
            <textarea
              rows={3}
              value={aiSettings.systemPrompt}
              onChange={(e) => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
              className="w-full p-2.5 rounded-2xl bg-subtle text-main outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingAi}
              className="px-4 py-2 rounded-full muse-pill text-[11px] font-semibold text-main hover:scale-102 active:scale-95"
            >
              {testingAi ? 'Prüfe...' : 'Verbindung testen'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] text-[11px] font-semibold shadow-sm hover:opacity-90"
            >
              {aiSaveSuccess ? 'Gespeichert!' : 'Speichern'}
            </button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-2xl text-[11px] leading-relaxed ${testResult.connected ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'}`}>
              <p className="font-bold">{testResult.connected ? '✓ Verbindung erfolgreich!' : '✗ Verbindung fehlgeschlagen'}</p>
              {testResult.connected ? (
                <p className="mt-0.5">Erreichbar unter: {testResult.baseUrl} ({testResult.models?.length || 0} Modelle geladen)</p>
              ) : (
                <p className="mt-0.5">{testResult.error}</p>
              )}
            </div>
          )}
        </form>
      )}

      {/* USERS */}
      {activeSection === 'users' && (
        <div className="space-y-2.5">
          {users.map((u) => (
            <div key={u.id} className="muse-card rounded-[22px] p-4 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-main">{u.username}</span>
                <span className="text-[10px] text-muted ml-2">({u.role})</span>
                <p className="text-[11px] text-muted">{u.email}</p>
              </div>
              <span className="text-[10px] text-muted">{u.memory_count} Fakten</span>
            </div>
          ))}
        </div>
      )}

      {/* REGISTRATION */}
      {activeSection === 'registration' && (
        <div className="muse-card rounded-[26px] p-5 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-main">Registrierungsmodus</h3>
          <p className="text-muted text-[11px]">Aktueller Modus: <b>{regMode}</b></p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                await fetch('/api/admin/registration/mode', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ mode: 'PUBLIC' }),
                });
                setRegMode('PUBLIC');
              }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold ${regMode === 'PUBLIC' ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]' : 'muse-pill text-muted'}`}
            >
              Öffentlich
            </button>
            <button
              onClick={async () => {
                await fetch('/api/admin/registration/mode', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ mode: 'INVITE_ONLY' }),
                });
                setRegMode('INVITE_ONLY');
              }}
              className={`flex-1 py-2 rounded-full text-xs font-semibold ${regMode === 'INVITE_ONLY' ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f]' : 'muse-pill text-muted'}`}
            >
              Einladungscode
            </button>
          </div>
        </div>
      )}

      {/* BACKUPS */}
      {activeSection === 'system' && (
        <div className="muse-card rounded-[26px] p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-main">Datenbank-Backups</h3>
            <button
              onClick={async () => {
                await fetch('/api/admin/backup', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                loadBackups();
              }}
              className="px-3 py-1.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] text-[11px] font-semibold"
            >
              Backup erstellen
            </button>
          </div>
          <div className="space-y-2 pt-1">
            {backups.map((b, i) => (
              <div key={i} className="p-3 rounded-2xl bg-subtle flex items-center justify-between text-[11px]">
                <span className="font-mono">{b.filename}</span>
                <a href={`/api/admin/backups/${b.filename}`} download className="p-1 text-muted hover:text-main">
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOGS */}
      {activeSection === 'logs' && (
        <div className="muse-card rounded-[26px] p-4 text-[11px] font-mono space-y-2 max-h-96 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="p-2 rounded-xl bg-subtle">
              <span className="font-bold text-accent">{l.action}</span>
              <span className="text-muted ml-2">{new Date(l.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
