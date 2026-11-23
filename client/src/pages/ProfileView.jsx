import React, { useState, useEffect } from 'react';
import {
  User,
  Palette,
  Sun,
  Moon,
  Cpu,
  ShieldCheck,
  Check,
  RefreshCw,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MaxMascot } from '../components/MaxMascot';

const COLOR_PRESETS = [
  { name: 'Max Classic Blue', hex: '#3B82F6' },
  { name: 'Emerald Wave', hex: '#10B981' },
  { name: 'Violet Spark', hex: '#8B5CF6' },
  { name: 'Sunset Amber', hex: '#F59E0B' },
  { name: 'Rose Petal', hex: '#EC4899' },
  { name: 'Slate Calm', hex: '#64748B' },
];

export function ProfileView() {
  const { user, token, theme, toggleTheme, updateUser } = useAuth();
  const [selectedColor, setSelectedColor] = useState(user?.avatar_color || '#3B82F6');
  const [username, setUsername] = useState(user?.username || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [checkingOllama, setCheckingOllama] = useState(false);

  useEffect(() => {
    checkOllama();
  }, []);

  const checkOllama = async () => {
    setCheckingOllama(true);
    try {
      const res = await fetch('/api/chat/status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setOllamaStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingOllama(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatar_color: selectedColor,
          username: username.trim(),
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler beim Speichern');
      }

      const data = await res.json();
      updateUser(data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-24 space-y-5">
      {/* Profile Card */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="p-3 rounded-full bg-subtle border border-border/70 flex-shrink-0 shadow-sm">
          <MaxMascot size={72} color={selectedColor} />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-main">{user?.username}</h2>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'bg-subtle text-muted'
              }`}
            >
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-muted">{user?.email}</p>
          <p className="text-xs text-muted pt-1">
            Mitglied seit {new Date().getFullYear()} • Lokale self-hostete Instanz
          </p>
        </div>
      </div>

      {/* Customize Max Mascot */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-bold text-main">Max Personalisierung</h3>
        </div>
        <p className="text-xs text-muted">
          Wähle deine bevorzugte Akzentfarbe für das Max-Maskottchen.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = selectedColor === preset.hex;
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setSelectedColor(preset.hex)}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                  isSelected
                    ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
                    : 'border-border bg-subtle/50 hover:bg-subtle'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full shadow-inner flex items-center justify-center text-white"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </span>
                <span className="text-xs font-medium text-main">{preset.name}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-main mb-1.5">Benutzername ändern</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold text-xs shadow-md hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>Gespeichert!</span>
              </>
            ) : saving ? (
              'Speichern...'
            ) : (
              'Änderungen speichern'
            )}
          </button>
        </div>
      </div>

      {/* Appearance & Theme */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-main">Erscheinungsbild</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-main">Farbschema</p>
            <p className="text-xs text-muted">
              Wähle zwischen hellem und dunklem Design.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-2xl bg-subtle hover:bg-border/60 border border-border text-xs font-semibold text-main flex items-center gap-2 transition-colors"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </div>

      {/* AI Backend & Ollama Status */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-bold text-main">KI-Backend (Ollama)</h3>
          </div>
          <button
            onClick={checkOllama}
            disabled={checkingOllama}
            className="p-2 rounded-xl hover:bg-subtle text-muted hover:text-main"
            title="Verbindung neu prüfen"
          >
            <RefreshCw className={`w-4 h-4 ${checkingOllama ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-subtle border border-border/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Verbindungsstatus:</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                ollamaStatus?.connected ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  ollamaStatus?.connected ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              {ollamaStatus?.connected ? 'Verbunden' : 'Nicht erreichbar'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Aktuelles Modell:</span>
            <span className="font-mono font-medium text-main">
              {ollamaStatus?.currentModel || 'llama3.2:latest'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Ollama URL:</span>
            <span className="font-mono text-muted text-[11px]">
              {ollamaStatus?.baseUrl || 'http://localhost:11434'}
            </span>
          </div>

          {!ollamaStatus?.connected && ollamaStatus?.error && (
            <p className="text-xs text-red-500 pt-1 border-t border-border/50">
              {ollamaStatus.error}
            </p>
          )}
        </div>
      </div>

      {/* Privacy & Self-Hosting Information */}
      <div className="bg-surface rounded-3xl p-6 border border-border shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-main">Datenschutz & Lokale Speicherung</h3>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Max speichert alle Daten ausschließlich lokal in einer verschlüsselten SQLite-Datenbank auf deiner eigenen Hardware.
          Es gibt keine Cloud-Synchronisation, keine externe Telemetrie und keine Drittanbieter-KI-APIs.
        </p>
        <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-[11px] text-emerald-800 dark:text-emerald-300">
          ✓ Chat-Nachrichten werden nach der Sitzung nicht persistent auf der Festplatte gespeichert.
          <br />
          ✓ 100% Offline-fähig bei lokal laufendem Ollama.
        </div>
      </div>
    </div>
  );
}
