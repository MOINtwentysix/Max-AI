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
  { name: 'Warm Clay (Muse)', hex: '#E8D5C4' },
  { name: 'Sky Blue', hex: '#3B82F6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Slate', hex: '#64748B' },
];

export function ProfileView() {
  const { user, token, theme, toggleTheme, updateUser } = useAuth();
  const [selectedColor, setSelectedColor] = useState(user?.avatar_color || '#E8D5C4');
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

      if (!res.ok) throw new Error('Fehler beim Speichern');
      const data = await res.json();
      updateUser(data.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 pt-2 pb-24 space-y-4">
      {/* Muse User Card */}
      <div className="muse-card rounded-[28px] p-5 flex items-center gap-4">
        <div className="p-2.5 rounded-full bg-subtle/80 flex-shrink-0">
          <MaxMascot size={52} color={selectedColor} />
        </div>
        <div className="flex-1 space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-main">{user?.username}</h2>
            <span className="px-2 py-0.5 rounded-full bg-subtle text-[10px] font-semibold text-muted">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-muted">{user?.email}</p>
        </div>
      </div>

      {/* Mascot Customization */}
      <div className="muse-card rounded-[28px] p-5 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-main">Max Begleiter-Farbe</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.hex}
              onClick={() => setSelectedColor(p.hex)}
              className={`p-2.5 rounded-2xl flex items-center gap-2 transition-all ${
                selectedColor === p.hex ? 'bg-black/10 dark:bg-white/10 ring-2 ring-main' : 'bg-subtle'
              }`}
            >
              <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: p.hex }} />
              <span className="text-[11px] font-medium truncate">{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        <div className="pt-2">
          <label className="block text-[11px] font-bold text-main mb-1">Benutzername</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-subtle text-xs text-main outline-none"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-5 py-2 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {saveSuccess ? 'Gespeichert!' : saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="muse-card rounded-[28px] p-5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-main">Erscheinungsbild</h3>
          <p className="text-[11px] text-muted">Design anpassen</p>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-full muse-pill text-xs font-semibold text-main flex items-center gap-1.5"
        >
          {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      {/* Ollama Status */}
      <div className="muse-card rounded-[28px] p-5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-main">KI-Verbindung</h3>
          <button onClick={checkOllama} className="p-1 text-muted hover:text-main">
            <RefreshCw className={`w-3.5 h-3.5 ${checkingOllama ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="p-3 rounded-2xl bg-subtle space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-muted">Status:</span>
            <span className={`font-bold ${ollamaStatus?.connected ? 'text-emerald-500' : 'text-red-500'}`}>
              {ollamaStatus?.connected ? 'Verbunden' : 'Nicht erreichbar'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">URL:</span>
            <span className="font-mono">{ollamaStatus?.baseUrl}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
