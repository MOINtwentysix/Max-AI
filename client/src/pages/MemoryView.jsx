import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Edit2,
  HardDrive,
  UserCheck,
  Bot,
  X,
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
  const [editingMemory, setEditingMemory] = useState(null);
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
    <div className="max-w-md mx-auto w-full px-4 pt-2 pb-24 space-y-4">
      {/* Muse-Style Storage Card */}
      <div className="muse-card rounded-[26px] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-main tracking-tight">Max Memory Storage</h2>
            <p className="text-xs text-muted mt-0.5">
              {storage ? `${storage.formattedUsed} / ${storage.formattedMax}` : 'Laden...'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-subtle text-[11px] font-semibold text-main">
            {storage?.count || 0} Fakten
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-subtle rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#1d1d1f] dark:bg-white transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(1, storage?.usedPercentage || 0))}%` }}
          />
        </div>
      </div>

      {/* Action & Search Pill */}
      <div className="flex items-center gap-2">
        <div className="flex-1 muse-pill rounded-full px-4 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Erinnerungen suchen..."
            className="w-full bg-transparent border-none outline-none text-xs text-main placeholder:text-muted"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-10 h-10 rounded-full muse-pill flex items-center justify-center text-main hover:scale-105 active:scale-95 transition-all flex-shrink-0"
          title="Erinnerung hinzufügen"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
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
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-10 text-xs text-muted">Lade Gedächtnis...</div>
        ) : memories.length === 0 ? (
          <div className="muse-card rounded-[26px] p-6 text-center text-muted text-xs">
            Noch keine Erinnerungen vorhanden.
          </div>
        ) : (
          memories.map((m) => {
            const isUserOrigin = m.origin === 'USER_STATEMENT';
            return (
              <div
                key={m.id}
                className="muse-card rounded-[22px] p-4 space-y-1.5 transition-transform hover:scale-[1.01]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-subtle text-[10px] font-semibold text-main">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-muted flex items-center gap-1">
                      {isUserOrigin ? <UserCheck className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                      {isUserOrigin ? 'Nutzer' : 'Max'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteMemory(m.id)}
                    className="p-1 text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-main leading-relaxed pt-0.5">{m.content}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="muse-card rounded-[30px] max-w-sm w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-main">Erinnerung anlegen</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-muted hover:text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMemory} className="space-y-3">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Was soll Max sich merken?"
                required
                rows={3}
                className="w-full p-3 rounded-2xl bg-subtle text-xs text-main placeholder:text-muted outline-none resize-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-subtle text-xs text-main outline-none"
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
                  className="px-5 py-2 rounded-full bg-[#1d1d1f] text-white dark:bg-white dark:text-[#1d1d1f] text-xs font-semibold shadow-sm"
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
