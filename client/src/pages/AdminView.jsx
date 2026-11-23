import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Cpu,
  Database,
  FileText,
  Lock,
  Unlock,
  Trash2,
  Plus,
  RefreshCw,
  HardDrive,
  Check,
  AlertCircle,
  Download,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AdminView() {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState('overview'); // overview, users, registration, ai, mcp, system, logs
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Overview metrics
  const [overview, setOverview] = useState(null);

  // Users list
  const [users, setUsers] = useState([]);

  // Registration & invite codes
  const [regMode, setRegMode] = useState('PUBLIC');
  const [inviteCodes, setInviteCodes] = useState([]);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(1);
  const [newCustomCode, setNewCustomCode] = useState('');

  // AI settings
  const [aiSettings, setAiSettings] = useState({
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2:latest',
    systemPrompt: '',
    temperature: 0.7,
  });
  const [aiSaveSuccess, setAiSaveSuccess] = useState(false);

  // MCP settings
  const [mcpSettings, setMcpSettings] = useState({
    enabled: false,
    maxServersPerUser: 5,
  });

  // System & Backups & Logs
  const [backups, setBackups] = useState([]);
  const [logs, setLogs] = useState([]);
  const [backupSuccess, setBackupSuccess] = useState(false);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Fehler beim Laden des Admin-Dashboards.');
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadRegistration = async () => {
    try {
      const res = await fetch('/api/admin/registration', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRegMode(data.mode);
      setInviteCodes(data.inviteCodes || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadAi = async () => {
    try {
      const res = await fetch('/api/admin/ai', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAiSettings({
        baseUrl: data.baseUrl,
        model: data.model,
        systemPrompt: data.systemPrompt,
        temperature: data.temperature,
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const loadMcp = async () => {
    try {
      const res = await fetch('/api/admin/mcp', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMcpSettings(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadBackups = async () => {
    try {
      const res = await fetch('/api/admin/backups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (err) {
      alert(err.message);
    }
  };

  // Switch section handler
  const handleSelectSection = (sec) => {
    setActiveSection(sec);
    if (sec === 'overview') loadOverview();
    if (sec === 'users') loadUsers();
    if (sec === 'registration') loadRegistration();
    if (sec === 'ai') loadAi();
    if (sec === 'mcp') loadMcp();
    if (sec === 'system') {
      loadOverview();
      loadBackups();
    }
    if (sec === 'logs') loadLogs();
  };

  // User actions
  const handleToggleLock = async (userId, currentLocked) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_locked: !currentLocked }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler');
      }
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler');
      }
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Benutzer wirklich dauerhaft samt Gedächtnis löschen?')) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler beim Löschen');
      }
      loadUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Registration Actions
  const handleSetRegMode = async (mode) => {
    try {
      const res = await fetch('/api/admin/registration/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error('Fehler beim Aktualisieren des Modus');
      setRegMode(mode);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateInviteCode = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/registration/invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: newCustomCode.trim() || undefined,
          max_uses: parseInt(newCodeMaxUses, 10),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler');
      }
      setNewCustomCode('');
      loadRegistration();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteInviteCode = async (id) => {
    try {
      await fetch(`/api/admin/registration/invite-codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadRegistration();
    } catch (err) {
      alert(err.message);
    }
  };

  // AI Save
  const handleSaveAi = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(aiSettings),
      });
      if (!res.ok) throw new Error('Fehler beim Speichern der KI-Einstellungen');
      setAiSaveSuccess(true);
      setTimeout(() => setAiSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.message);
    }
  };

  // MCP Save
  const handleSaveMcp = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/admin/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(mcpSettings),
      });
      alert('MCP Einstellungen aktualisiert.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Backup Create
  const handleCreateBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Backup fehlgeschlagen');
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
      loadBackups();
    } catch (err) {
      alert(err.message);
    }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: HardDrive },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'registration', label: 'Registration', icon: Key },
    { id: 'ai', label: 'AI Settings', icon: Cpu },
    { id: 'mcp', label: 'MCP', icon: Shield },
    { id: 'system', label: 'System & Backup', icon: Database },
    { id: 'logs', label: 'Logs', icon: Terminal },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pt-4 pb-24 space-y-5">
      {/* Admin Title & Section Selector */}
      <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-main">Max Administration</h1>
              <p className="text-xs text-muted">Zentrale System- und Benutzersteuerung</p>
            </div>
          </div>
        </div>

        {/* Sub-nav Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSel = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectSection(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSel
                    ? 'bg-purple-600 text-white border-transparent shadow-sm'
                    : 'bg-surface text-muted hover:text-main border-border hover:bg-subtle'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. OVERVIEW SECTION */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted font-medium">Registrierte Nutzer</p>
              <p className="text-2xl font-bold text-main mt-1">
                {overview?.users?.total || 0}
              </p>
              <p className="text-[11px] text-emerald-500 mt-1">
                {overview?.users?.active || 0} aktiv
              </p>
            </div>

            <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted font-medium">Gesamter Memory-Speicher</p>
              <p className="text-2xl font-bold text-main mt-1">
                {overview?.memories?.formattedTotal || '0 B'}
              </p>
              <p className="text-[11px] text-muted mt-1">
                {overview?.memories?.count || 0} Einträge
              </p>
            </div>

            <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted font-medium">Ollama KI-Status</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className={`w-3 h-3 rounded-full ${
                    overview?.ollama?.connected ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-base font-bold text-main">
                  {overview?.ollama?.connected ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-muted mt-1 truncate">
                Modell: {overview?.ollama?.currentModel}
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-main uppercase tracking-wider">
              Systemstatus
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-subtle">
                <span className="text-muted block text-[10px]">Node.js</span>
                <span className="font-semibold text-main">{overview?.system?.nodeVersion}</span>
              </div>
              <div className="p-3 rounded-2xl bg-subtle">
                <span className="text-muted block text-[10px]">Uptime</span>
                <span className="font-semibold text-main">
                  {Math.floor((overview?.system?.uptimeSeconds || 0) / 60)} min
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-subtle">
                <span className="text-muted block text-[10px]">RAM (Heap)</span>
                <span className="font-semibold text-main">{overview?.system?.memoryHeapUsed}</span>
              </div>
              <div className="p-3 rounded-2xl bg-subtle">
                <span className="text-muted block text-[10px]">Platform</span>
                <span className="font-semibold text-main">{overview?.system?.platform}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS SECTION */}
      {activeSection === 'users' && (
        <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-main">Benutzerverwaltung</h3>
            <span className="text-xs text-muted">{users.length} Benutzer insgesamt</span>
          </div>

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-subtle border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-main text-sm">{u.username}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {u.role}
                    </span>
                    {u.is_locked ? (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                        Gesperrt
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted mt-0.5">{u.email}</p>
                  <p className="text-[11px] text-muted mt-1">
                    Gedächtnis: {u.memory_count} Einträge ({u.formatted_memory})
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface border border-border text-xs text-main"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>

                  <button
                    onClick={() => handleToggleLock(u.id, u.is_locked)}
                    className={`p-2 rounded-xl border border-border ${
                      u.is_locked ? 'bg-amber-500 text-white' : 'bg-surface text-muted hover:text-main'
                    }`}
                    title={u.is_locked ? 'Entsperren' : 'Sperren'}
                  >
                    {u.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-2 rounded-xl bg-surface border border-border hover:bg-red-50 text-muted hover:text-red-500"
                    title="Benutzer löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. REGISTRATION SECTION */}
      {activeSection === 'registration' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-main">Registrierungsmodus</h3>
            <p className="text-xs text-muted">
              Lege fest, wer sich auf dieser Max-Instanz registrieren darf.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleSetRegMode('PUBLIC')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  regMode === 'PUBLIC'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 ring-2 ring-purple-600/20'
                    : 'border-border bg-subtle hover:bg-subtle/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-main">Modus A: Öffentlich</span>
                  {regMode === 'PUBLIC' && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-xs text-muted">
                  Jeder Besucher kann sich frei ohne Einladungscode registrieren.
                </p>
              </button>

              <button
                onClick={() => handleSetRegMode('INVITE_ONLY')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  regMode === 'INVITE_ONLY'
                    ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 ring-2 ring-purple-600/20'
                    : 'border-border bg-subtle hover:bg-subtle/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-main">Modus B: Einladungscode</span>
                  {regMode === 'INVITE_ONLY' && <Check className="w-4 h-4 text-purple-600" />}
                </div>
                <p className="text-xs text-muted">
                  Registrierung ist streng nur mit einem gültigen Einladungscode möglich.
                </p>
              </button>
            </div>
          </div>

          {/* Invitation codes manager */}
          <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-main">Einladungscodes verwalten</h3>

            <form onSubmit={handleCreateInviteCode} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={newCustomCode}
                onChange={(e) => setNewCustomCode(e.target.value)}
                placeholder="Code (leer lassen für automatischen Code)"
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-xs md:text-sm text-main"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newCodeMaxUses}
                  onChange={(e) => setNewCodeMaxUses(e.target.value)}
                  className="w-20 px-3 py-2.5 rounded-2xl bg-subtle border border-border text-xs md:text-sm text-main text-center"
                  title="Maximale Verwendungen"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Code erstellen</span>
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-2">
              {inviteCodes.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Noch keine Einladungscodes generiert.</p>
              ) : (
                inviteCodes.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-subtle border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-main tracking-wider">{c.code}</span>
                      <span className="text-muted ml-2">
                        Verwendet: {c.uses_count} / {c.max_uses > 0 ? c.max_uses : 'unbegrenzt'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteInviteCode(c.id)}
                      className="p-1.5 rounded-xl hover:bg-red-50 text-muted hover:text-red-500"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. AI & OLLAMA SETTINGS */}
      {activeSection === 'ai' && (
        <form onSubmit={handleSaveAi} className="bg-surface rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-main">KI- und Ollama-Konfiguration</h3>

          <div>
            <label className="block text-xs font-semibold text-main mb-1.5">Ollama Base URL</label>
            <input
              type="text"
              value={aiSettings.baseUrl}
              onChange={(e) => setAiSettings({ ...aiSettings, baseUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main font-mono"
            />
            <p className="text-[11px] text-muted mt-1">
              Im Docker-Betrieb: Z. B. <code>http://host.docker.internal:11434</code> oder IP des Hosts.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-main mb-1.5">KI-Modell</label>
            <input
              type="text"
              value={aiSettings.model}
              onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-main mb-1.5">System-Prompt für Max</label>
            <textarea
              rows={4}
              value={aiSettings.systemPrompt}
              onChange={(e) => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-main mb-1.5">
              Temperatur: {aiSettings.temperature}
            </label>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={aiSettings.temperature}
              onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
              className="w-full accent-purple-600"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white font-semibold text-xs shadow-md hover:opacity-90 flex items-center gap-1.5"
            >
              {aiSaveSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{aiSaveSuccess ? 'Gespeichert!' : 'Einstellungen speichern'}</span>
            </button>
          </div>
        </form>
      )}

      {/* 5. MCP MANAGEMENT (Future-Ready) */}
      {activeSection === 'mcp' && (
        <form onSubmit={handleSaveMcp} className="bg-surface rounded-3xl p-6 border border-border shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-main">MCP Management (Model Context Protocol)</h3>
          <p className="text-xs text-muted leading-relaxed">
            Bereite Max auf die Erweiterung mit externen MCP-Servern vor (z. B. Kalender, Dateisystem, Tools).
          </p>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-subtle border border-border">
            <div>
              <span className="text-xs font-bold text-main block">MCP global aktivieren</span>
              <span className="text-[11px] text-muted">Aktiviert die MCP-Erweiterungsarchitektur für Benutzer</span>
            </div>
            <input
              type="checkbox"
              checked={mcpSettings.enabled}
              onChange={(e) => setMcpSettings({ ...mcpSettings, enabled: e.target.checked })}
              className="w-5 h-5 accent-purple-600 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-main mb-1.5">
              Maximale Anzahl verbundener MCP-Server pro Nutzer
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={mcpSettings.maxServersPerUser}
              onChange={(e) => setMcpSettings({ ...mcpSettings, maxServersPerUser: parseInt(e.target.value, 10) })}
              className="w-32 px-3.5 py-2 rounded-2xl bg-subtle border border-border text-sm text-main"
            />
            <p className="text-[11px] text-muted mt-1">Standardwert ist 5 Server pro Nutzer.</p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-purple-600 text-white font-semibold text-xs shadow-md hover:opacity-90"
            >
              MCP-Konfiguration sichern
            </button>
          </div>
        </form>
      )}

      {/* 6. SYSTEM & BACKUPS */}
      {activeSection === 'system' && (
        <div className="space-y-4">
          <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-main">Datenbank-Backups</h3>
                <p className="text-xs text-muted">
                  Erstelle konsistente SQLite-Snapshots direkt im Docker-Volume.
                </p>
              </div>
              <button
                onClick={handleCreateBackup}
                className="px-4 py-2.5 rounded-2xl bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                <span>Backup jetzt erstellen</span>
              </button>
            </div>

            {backupSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Backup erfolgreich erstellt!</span>
              </div>
            )}

            <div className="space-y-2 pt-2">
              {backups.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">Noch keine Backups vorhanden.</p>
              ) : (
                backups.map((b, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-subtle border border-border flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-main block">{b.filename}</span>
                      <span className="text-muted text-[11px]">
                        Größe: {b.formattedSize} • Erstellt: {new Date(b.createdAt).toLocaleString('de-DE')}
                      </span>
                    </div>
                    <a
                      href={`/api/admin/backups/${b.filename}`}
                      download
                      className="p-2 rounded-xl bg-surface hover:bg-border text-muted hover:text-main border border-border"
                      title="Herunterladen"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. AUDIT LOGS */}
      {activeSection === 'logs' && (
        <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-main">Audit- und Systemprotokolle</h3>
            <button
              onClick={loadLogs}
              className="p-2 rounded-xl hover:bg-subtle text-muted hover:text-main"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-subtle border border-border text-xs space-y-1 font-mono"
              >
                <div className="flex items-center justify-between text-muted text-[10px]">
                  <span>{new Date(log.created_at).toLocaleString('de-DE')}</span>
                  <span>IP: {log.ip_address || 'local'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-purple-600 dark:text-purple-400">
                    {log.action}
                  </span>
                  <span className="text-muted text-[11px]">by {log.username || log.user_id}</span>
                </div>
                {log.details && (
                  <p className="text-muted text-[11px] truncate">{log.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
