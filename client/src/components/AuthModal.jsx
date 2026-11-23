import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MaxMascot } from '../components/MaxMascot';
import { ShieldCheck, ArrowRight, Lock, User, Mail, Key } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface rounded-3xl max-w-sm w-full p-6 md:p-8 border border-border shadow-2xl space-y-5 animate-scale-up">
        {/* Header with Mascot */}
        <div className="text-center space-y-2">
          <div className="inline-block p-2 rounded-full bg-subtle border border-border mb-1">
            <MaxMascot size={56} color="#3B82F6" />
          </div>
          <h1 className="text-xl font-bold text-main tracking-tight">
            {isLogin ? 'Willkommen zurück' : 'Lerne Max kennen'}
          </h1>
          <p className="text-xs text-muted">
            {isLogin
              ? 'Melde dich an, um mit Max zu sprechen.'
              : regModeInfo.isFirstUser
              ? 'Erster Start! Der erste Account wird als System-Administrator angelegt.'
              : 'Erstelle deinen persönlichen Max-Account.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-main mb-1">
              {isLogin ? 'Benutzername oder E-Mail' : 'Benutzername'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? 'alex oder alex@beispiel.de' : 'alex'}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-main mb-1">E-Mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@beispiel.de"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-main mb-1">Passwort</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main placeholder:text-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {!isLogin && !regModeInfo.isFirstUser && regModeInfo.registrationMode === 'INVITE_ONLY' && (
            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Einladungscode (Erforderlich)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="MAX-XXXXXX"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main placeholder:text-muted font-mono uppercase focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-accent text-white font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Bitte warten...' : isLogin ? 'Anmelden' : 'Registrieren'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-muted hover:text-accent font-medium transition-colors"
          >
            {isLogin ? 'Noch kein Account? Jetzt registrieren' : 'Bereits registriert? Hier anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
}
