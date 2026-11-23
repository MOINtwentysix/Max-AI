import React, { useState } from 'react';
import { MaxMascot } from './MaxMascot';
import { Plus, Share2, Copy, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Header({ onNewChat }) {
  const { user, token } = useAuth();
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
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {/* Left: New Chat Button (Replacing Light/Dark Mode) */}
          <button
            onClick={onNewChat}
            className="h-11 px-4 rounded-full muse-pill flex items-center gap-1.5 text-xs font-bold text-main hover:text-accent active:scale-95 transition-all shadow-sm"
            title="Neuen Chat starten"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Neuer Chat</span>
          </button>

          {/* Center: Floating Pill with Orange Max Mascot & Name */}
          <div className="flex flex-col items-center">
            <div className="px-5 py-1.5 rounded-full muse-pill flex flex-col items-center justify-center cursor-default hover:scale-[1.02] transition-transform shadow-sm">
              <MaxMascot size={32} />
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
                <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-600">
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
