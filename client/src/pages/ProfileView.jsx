import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Sparkles,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MaxMascot } from '../components/MaxMascot';

export function ProfileView() {
  const { user, token, theme, toggleTheme, updateUser, logout } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
          username: username.trim(),
          first_name: firstName.trim(),
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
    <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-24 md:pb-8 space-y-5">
      {/* User Header Card */}
      <div className="muse-card rounded-[28px] p-6 flex items-center gap-5">
        <div className="p-1 rounded-full bg-subtle/80 flex-shrink-0 shadow-sm">
          <MaxMascot size={64} />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-main">
              {user?.first_name ? `${user.first_name} (${user.username})` : user?.username}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-subtle text-[11px] font-bold text-muted uppercase">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-muted font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form: Name & First Name */}
      <form onSubmit={handleSaveProfile} className="muse-card rounded-[28px] p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-main">Persönliche Angaben</h3>

        <div>
          <label className="block text-[11px] font-bold text-main mb-1.5">
            Dein Vorname (Wie Max dich ansprechen soll)
          </label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="z.B. Alex oder Eymen"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-subtle text-xs text-main outline-none font-medium focus:ring-2 focus:ring-main/20"
            />
          </div>
          <p className="text-[10px] text-muted mt-1">
            Max verwendet diesen Namen direkt in allen Gesprächen.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-main mb-1.5">Benutzername</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2.5 rounded-2xl bg-subtle text-xs text-main outline-none font-medium"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] text-xs font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {saveSuccess ? 'Gespeichert!' : saving ? 'Speichern...' : 'Änderungen speichern'}
          </button>
        </div>
      </form>

      {/* Max Farbauswahl -> Coming Soon Card */}
      <div className="muse-card rounded-[28px] p-6 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-main">Max Farbvarianten</h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold uppercase tracking-wider">
            Coming soon
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          Individuelle Farbanpassungen für das Max-Maskottchen werden in einem kommenden Update freigeschaltet.
        </p>
      </div>

      {/* Appearance */}
      <div className="muse-card rounded-[28px] p-6 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-main">Erscheinungsbild</h3>
          <p className="text-[11px] text-muted">Helles oder dunkles Design</p>
        </div>
        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-full muse-pill text-xs font-semibold text-main flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          {theme === 'dark' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
      </div>

      {/* Logout Button in Profile */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-3.5 rounded-full muse-pill text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Vom Account abmelden</span>
        </button>
      </div>
    </div>
  );
}
