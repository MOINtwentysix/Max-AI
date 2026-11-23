import React, { useState } from 'react';
import { MaxMascot } from './MaxMascot';
import { Sun, Moon, Copy, Check, X, Share2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ isThinking = false }) {
  const { user, theme, toggleTheme, token } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loadingInvite, setLoadingInvite] = useState(false);

  const handleOpenInvite = async () => {
    setShowInviteModal(true);
    setLoadingInvite(true);
    try {
      const res = await fetch('/api/auth/my-invite-code', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInviteData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteData?.inviteCode) {
      navigator.clipboard.writeText(inviteData.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full pt-3 pb-2 px-4 bg-transparent select-none">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Left: Floating Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="w-11 h-11 rounded-full muse-pill flex items-center justify-center text-muted hover:text-main active:scale-95 transition-all shadow-sm"
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-[#1d1d1f]" />
            )}
          </button>

          {/* Center: Floating Pill with Boomerang Mascot & Name */}
          <div className="flex flex-col items-center">
            <div className="px-5 py-2 rounded-full muse-pill flex flex-col items-center justify-center cursor-default hover:scale-[1.02] transition-transform shadow-sm">
              <MaxMascot
                size={34}
                color={user?.avatar_color || '#3B82F6'}
                isThinking={isThinking}
              />
              <span className="text-[12px] font-bold text-main tracking-tight mt-0.5">
                Max
              </span>
            </div>
          </div>

          {/* Right: Floating "Invite" Pill Button */}
          <button
            onClick={handleOpenInvite}
            className="h-11 px-5 rounded-full muse-pill flex items-center justify-center text-[13px] font-bold text-main hover:text-accent active:scale-95 transition-all shadow-sm"
            title="Freunde einladen"
          >
            <span>Invite</span>
          </button>
        </div>
      </header>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="muse-card rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-accent/10 text-accent">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-main">Freunde einladen</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-full text-muted hover:text-main hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Teile deinen persönlichen Einladungscode mit Freunden, damit sie sich auf deiner Max-Instanz registrieren können:
            </p>

            <div className="p-4 rounded-2xl bg-subtle/80 border border-border flex items-center justify-between">
              <div>
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider block">
                  Dein Einladungscode
                </span>
                <span className="text-lg font-mono font-bold text-main tracking-wider mt-0.5 block">
                  {loadingInvite ? 'Laden...' : inviteData?.inviteCode || 'MAX-INVITE'}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                disabled={loadingInvite}
                className="px-3.5 py-2 rounded-full bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
              </button>
            </div>

            <p className="text-[11px] text-muted text-center pt-1">
              Verwendet: {inviteData?.usesCount || 0} von {inviteData?.maxUses || 5} Plätzen
            </p>
          </div>
        </div>
      )}
    </>
  );
}
