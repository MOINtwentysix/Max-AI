import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Cpu,
  ShieldCheck,
  Check,
  RefreshCw,
  User as UserIcon,
  Sparkles,
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
    <div className="max-w-2xl mx-auto w-full px-4 pt-6 pb-28 space-y-6">
      {/* User Header Profile Card */}
      <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border shadow-soft flex flex-col sm:flex-row items-center sm:items-start gap-6 transition-all">
        <div className="p-4 rounded-full bg-subtle/70 border border-border flex-shrink-0 shadow-inner">
          <MaxMascot size={76} color={selectedColor} />
        </div>
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-2xl font-bold text-main tracking-tight">{user?.username}</h2>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  : 'bg-subtle text-muted border border-border'
              }`}
            >
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-muted font-medium">{user?.email}</p>
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 text-xs text-muted">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Persönliche Max-Instanz • Vollständig self-hosted</span>
          </div>
        </div>
      </div>

      {/* Customize Max Mascot */}
      <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border shadow-soft space-y-5 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-accent/10 text-accent">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-main">Max Personalisierung</h3>
            <p className="text-xs text-muted mt-0.5">
              Wähle deine bevorzugte Akzentfarbe für das Max-Maskottchen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = selectedColor === preset.hex;
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setSelectedColor(preset.hex)}
                className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all duration-200 ${
                  isSelected
                    ? 'border-accent bg-accent/10 ring-2 ring-accent/30 shadow-sm scale-[1.02]'
                    : 'border-border bg-subtle/50 hover:bg-subtle hover:scale-[1.01]'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full shadow-md flex items-center justify-center text-white flex-shrink-0 transition-transform"
                  style={{ backgroundColor: preset.hex }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>
                <span className="text-xs font-semibold text-main truncate">{preset.name}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-border/60">
          <label className="block text-xs font-bold text-main mb-2">Benutzername ändern</label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-subtle border border-border text-sm text-main font-medium focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-6 py-3 rounded-2xl bg-accent text-white font-bold text-xs shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200 stroke-[3]" />
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
      <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border shadow-soft flex items-center justify-between gap-4 transition-all">
        <div>
          <h3 className="text-base font-bold text-main">Erscheinungsbild</h3>
          <p className="text-xs text-muted mt-0.5">
            Wähle zwischen hellem und dunklem Design.
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className="px-5 py-2.5 rounded-2xl bg-subtle hover:bg-border/60 border border-border text-xs font-bold text-main flex items-center gap-2.5 transition-all duration-200 active:scale-95 shadow-sm"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-4 h-4 text-blue-400" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
            </>
          )}
        </button>
      </div>

      {/* AI Backend & Ollama Status */}
      <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border shadow-soft space-y-4 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent/10 text-accent">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-main">KI-Backend (Ollama)</h3>
              <p className="text-xs text-muted mt-0.5">Aktuelle Verbindungsinformationen</p>
            </div>
          </div>
          <button
            onClick={checkOllama}
            disabled={checkingOllama}
            className="p-2.5 rounded-2xl hover:bg-subtle text-muted hover:text-main border border-transparent hover:border-border transition-all active:scale-95"
            title="Verbindung neu prüfen"
          >
            <RefreshCw className={`w-4 h-4 ${checkingOllama ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-subtle/80 border border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Verbindungsstatus:</span>
            <span
              className={`font-bold flex items-center gap-2 ${
                ollamaStatus?.connected ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  ollamaStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              {ollamaStatus?.connected ? 'Verbunden' : 'Nicht erreichbar'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Aktuelles Modell:</span>
            <span className="font-mono font-bold text-main">
              {ollamaStatus?.currentModel || 'llama3.2:latest'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Ollama URL:</span>
            <span className="font-mono text-muted text-[11px] truncate max-w-[240px]">
              {ollamaStatus?.baseUrl || 'http://host.docker.internal:11434'}
            </span>
          </div>

          {!ollamaStatus?.connected && ollamaStatus?.error && (
            <p className="text-xs text-red-500 pt-2 border-t border-border/60 leading-relaxed">
              {ollamaStatus.error}
            </p>
          )}
        </div>
      </div>

      {/* Privacy & Self-Hosting Information */}
      <div className="bg-surface rounded-3xl p-6 md:p-8 border border-border shadow-soft space-y-3 transition-all">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-main">Datenschutz & Lokale Speicherung</h3>
            <p className="text-xs text-muted mt-0.5">Deine Daten bleiben bei dir</p>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Max speichert alle Daten ausschließlich lokal in einer verschlüsselten SQLite-Datenbank auf deiner eigenen Hardware.
          Es gibt keine Cloud-Synchronisation, keine externe Telemetrie und keine Drittanbieter-KI-APIs.
        </p>
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 font-medium space-y-1">
          <p>✓ Chat-Nachrichten werden nach der Sitzung nicht persistent auf der Festplatte gespeichert.</p>
          <p>✓ 100% Offline-fähig bei lokal laufendem Ollama.</p>
        </div>
      </div>
    </div>
  );
}
