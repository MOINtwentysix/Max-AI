import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MaxMascot } from '../components/MaxMascot';
import { ArrowRight, Lock, User, Mail, Key } from 'lucide-react';

export function AuthModal() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [regModeInfo, setRegModeInfo] = useState({
    registrationMode: 'PUBLIC',
    isFirstUser: false,
  });

  useEffect(() => {
    fetch('/api/auth/mode')
      .then((r) => r.json())
      .then((data) => setRegModeInfo(data))
      .catch((err) => console.error(err));
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { usernameOrEmail: username, password }
        : {
            username: username.trim(),
            email: email.trim(),
            password,
            inviteCode: inviteCode.trim() || undefined,
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentifizierung fehlgeschlagen.');
      }

      login(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f5f5f7] dark:bg-[#0a0a0c] flex items-center justify-center p-4">
      <div className="muse-card rounded-[36px] max-w-sm w-full p-8 space-y-6 shadow-2xl animate-scale-up">
        {/* Mascot & Welcome Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full muse-pill mb-1">
            <MaxMascot size={64} color="#3B82F6" />
          </div>
          <h1 className="text-2xl font-bold text-main tracking-tight">
            {isLogin ? 'Willkommen bei Max' : 'Erstelle deinen Begleiter'}
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            {isLogin
              ? 'Melde dich an, um dein Gespräch fortzusetzen.'
              : regModeInfo.isFirstUser
              ? 'Erster Start! Der erste Account wird als Administrator angelegt.'
              : 'Max merkt sich deine Gedanken, Ziele und Vorlieben.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200/50 text-red-600 dark:text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? 'Benutzername oder E-Mail' : 'Benutzername'}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-subtle border-none text-xs md:text-sm text-main placeholder:text-muted outline-none focus:ring-2 focus:ring-[#1d1d1f] dark:focus:ring-white transition-all font-medium"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-Mail-Adresse"
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-subtle border-none text-xs md:text-sm text-main placeholder:text-muted outline-none focus:ring-2 focus:ring-[#1d1d1f] dark:focus:ring-white transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort"
                className="w-full pl-11 pr-4 py-3 rounded-full bg-subtle border-none text-xs md:text-sm text-main placeholder:text-muted outline-none focus:ring-2 focus:ring-[#1d1d1f] dark:focus:ring-white transition-all font-medium"
              />
            </div>
          </div>

          {!isLogin && !regModeInfo.isFirstUser && regModeInfo.registrationMode === 'INVITE_ONLY' && (
            <div>
              <div className="relative">
                <Key className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Einladungscode"
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-subtle border-none text-xs md:text-sm text-main placeholder:text-muted uppercase font-mono outline-none focus:ring-2 focus:ring-[#1d1d1f] dark:focus:ring-white transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] font-bold text-xs shadow-md hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Bitte warten...' : isLogin ? 'Anmelden' : 'Account erstellen'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Switch Login / Sign Up */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-muted hover:text-main font-semibold transition-colors"
          >
            {isLogin ? 'Noch kein Account? Hier registrieren' : 'Bereits registriert? Hier anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
}
