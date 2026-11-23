import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  HardDrive,
  UserCheck,
  Bot,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'ALL',
  'Persönliches',
  'Interessen',
  'Projekte',
  'Personen',
  'Vorlieben',
  'Wissen',
  'Sonstiges',
];

export function MemoryView() {
  const { token } = useAuth();
  const [memories, setMemories] = useState([]);
  const [storage, setStorage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Persönliches');
  const [newConfidence, setNewConfidence] = useState(1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/memory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Fehler beim Laden');
      const data = await res.json();
      setMemories(data.memories || []);
      setStorage(data.storage || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [selectedCategory, searchQuery]);

  const handleCreateMemory = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newContent.trim(),
          category: newCategory,
          confidence: parseFloat(newConfidence),
        }),
      });

      if (!res.ok) throw new Error('Fehler beim Anlegen');
      setNewContent('');
      setShowAddModal(false);
      fetchMemories();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!confirm('Erinnerung wirklich löschen?')) return;
    try {
      await fetch(`/api/memory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMemories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-24 md:pb-8 space-y-5">
      {/* Max LTM (Long Time Memory) Header Card */}
      <div className="muse-card rounded-[28px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
              <Brain className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-main tracking-tight">Max LTM</h2>
              <p className="text-xs text-muted font-medium">Long Time Memory (Persistenter Speicher)</p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-full bg-subtle text-xs font-bold text-main">
            {storage?.count || 0} Fakten
          </span>
        </div>

        {/* Storage Bar (1 GB Limit) */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted font-medium mb-1.5">
            <span>Speicherverbrauch</span>
            <span>{storage ? `${storage.formattedUsed} / ${storage.formattedMax}` : 'Laden...'}</span>
          </div>
          <div className="w-full bg-subtle rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(1, storage?.usedPercentage || 0))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action & Search Pill */}
      <div className="flex items-center gap-2.5">
        <div className="flex-1 muse-pill rounded-full px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Max LTM durchsuchen..."
            className="w-full bg-transparent border-none outline-none text-xs text-main placeholder:text-muted font-medium"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-11 h-11 rounded-full muse-pill flex items-center justify-center text-main hover:text-amber-600 active:scale-95 transition-all flex-shrink-0 shadow-sm"
          title="Fakt manuell hinzufügen"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] shadow-sm'
                : 'muse-pill text-muted hover:text-main'
            }`}
          >
            {cat === 'ALL' ? 'Alle' : cat}
          </button>
        ))}
      </div>

      {/* Memory List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-xs text-muted font-medium">Lade Max LTM...</div>
        ) : memories.length === 0 ? (
          <div className="muse-card rounded-[28px] p-8 text-center text-muted text-xs space-y-1">
            <p className="font-bold text-main text-sm">Noch keine LTM-Einträge</p>
            <p>Sobald du mit Max sprichst, merkt er sich wichtige Dinge automatisch.</p>
          </div>
        ) : (
          memories.map((m) => {
            const isUserOrigin = m.origin === 'USER_STATEMENT';
            return (
              <div
                key={m.id}
                className="muse-card rounded-[24px] p-5 space-y-2 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-subtle text-[11px] font-bold text-main">
                      {m.category}
                    </span>
                    <span className="text-[11px] text-muted flex items-center gap-1 font-medium">
                      {isUserOrigin ? <UserCheck className="w-3.5 h-3.5 text-blue-500" /> : <Bot className="w-3.5 h-3.5 text-amber-500" />}
                      {isUserOrigin ? 'Nutzer-Aussage' : 'Max-LTM'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="p-1.5 text-muted hover:text-red-500 rounded-lg hover:bg-black/5 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-main leading-relaxed font-medium pt-0.5">{m.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="muse-card rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-main">Fakt in Max LTM anlegen</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-muted hover:text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMemory} className="space-y-3.5">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Was soll Max sich dauerhaft merken?"
                required
                rows={3}
                className="w-full p-3.5 rounded-2xl bg-subtle text-xs text-main placeholder:text-muted outline-none resize-none font-medium"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-3 rounded-2xl bg-subtle text-xs text-main font-semibold outline-none"
              >
                {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-muted"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newContent.trim()}
                  className="px-5 py-2.5 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] text-xs font-bold shadow-sm"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
