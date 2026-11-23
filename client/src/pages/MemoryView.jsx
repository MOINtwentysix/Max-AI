import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  Plus,
  Trash2,
  Edit2,
  HardDrive,
  RefreshCw,
  Filter,
  UserCheck,
  Bot,
  AlertTriangle,
  X,
  Check,
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

  // Modals / forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMemory, setEditingMemory] = useState(null);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Persönliches');
  const [newConfidence, setNewConfidence] = useState(1.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/memory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Fehler beim Laden des Gedächtnisses.');
      const data = await res.json();
      setMemories(data.memories || []);
      setStorage(data.storage || null);
    } catch (err) {
      setError(err.message);
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

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler beim Anlegen');
      }

      setNewContent('');
      setShowAddModal(false);
      fetchMemories();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMemory = async (e) => {
    e.preventDefault();
    if (!editingMemory || !newContent.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/memory/${editingMemory.id}`, {
        method: 'PATCH',
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

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Fehler beim Bearbeiten');
      }

      setEditingMemory(null);
      setNewContent('');
      fetchMemories();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMemory = async (id) => {
    if (!confirm('Möchtest du diese Erinnerung wirklich dauerhaft löschen?')) return;
    try {
      const res = await fetch(`/api/memory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Fehler beim Löschen');
      fetchMemories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('ACHTUNG: Möchtest du das gesamte Gedächtnis von Max für deinen Account unwiderruflich löschen?')) return;
    try {
      const res = await fetch('/api/memory', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Fehler beim Zurücksetzen');
      fetchMemories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-24 space-y-5">
      {/* Storage Quota Card */}
      <div className="bg-surface rounded-3xl p-5 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-accent/10 text-accent">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-main">Memory Storage</h2>
              <p className="text-xs text-muted">
                {storage ? `${storage.formattedUsed} / ${storage.formattedMax}` : 'Laden...'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-subtle text-main border border-border">
              {storage?.count || 0} Erinnerungen
            </span>
          </div>
        </div>

        {/* Progress Bar (Enforcing 1 GB limit) */}
        <div className="w-full bg-subtle rounded-full h-2.5 overflow-hidden border border-border/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              Number(storage?.usedPercentage || 0) > 90 ? 'bg-red-500' : 'bg-accent'
            }`}
            style={{ width: `${Math.min(100, Math.max(1, storage?.usedPercentage || 0))}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
          <span>Persistenter lokaler SQLite-Speicher</span>
          <span>{storage?.usedPercentage || 0}% belegt</span>
        </div>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Erinnerungen durchsuchen..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-surface border border-border text-xs md:text-sm text-main placeholder:text-muted focus:outline-none focus:border-accent shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingMemory(null);
              setNewContent('');
              setNewCategory('Persönliches');
              setNewConfidence(1.0);
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-accent text-white font-medium text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Erinnerung hinzufügen</span>
          </button>
          <button
            onClick={handleClearAll}
            className="p-2.5 rounded-2xl bg-surface hover:bg-red-50 dark:hover:bg-red-950/40 text-muted hover:text-red-500 border border-border shadow-sm transition-colors"
            title="Gedächtnis vollständig zurücksetzen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-main text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-sm font-semibold'
                : 'bg-surface text-muted hover:text-main border-border hover:bg-subtle'
            }`}
          >
            {cat === 'ALL' ? 'Alle Kategorien' : cat}
          </button>
        ))}
      </div>

      {/* Memories List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted text-sm">
            Lade Max Memory...
          </div>
        ) : memories.length === 0 ? (
          <div className="bg-surface rounded-3xl p-8 text-center border border-border shadow-sm">
            <Brain className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-main">Noch keine Erinnerungen vorhanden</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Sobald du mit Max chattest, merkt er sich automatisch wichtige Details über dich oder du legst manuell eine Erinnerung an.
            </p>
          </div>
        ) : (
          memories.map((m) => {
            const isUserOrigin = m.origin === 'USER_STATEMENT';
            return (
              <div
                key={m.id}
                className="bg-surface rounded-3xl p-4 border border-border shadow-sm hover:border-accent/40 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-subtle text-main border border-border/80">
                        {m.category}
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isUserOrigin
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                        }`}
                      >
                        {isUserOrigin ? <UserCheck className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        {isUserOrigin ? 'Nutzer-Aussage' : 'Max-Schlussfolgerung'}
                      </span>
                      <span className="text-[10px] text-muted">
                        Vertrauen: {Math.round(m.confidence * 100)}%
                      </span>
                    </div>

                    <p className="text-sm text-main leading-relaxed pt-0.5">
                      {m.content}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-muted pt-1">
                      <span>Erstellt: {new Date(m.created_at).toLocaleDateString('de-DE')}</span>
                      <span>•</span>
                      <span>Größe: {m.data_size_bytes} B</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingMemory(m);
                        setNewContent(m.content);
                        setNewCategory(m.category);
                        setNewConfidence(m.confidence);
                        setShowAddModal(true);
                      }}
                      className="p-2 rounded-xl hover:bg-subtle text-muted hover:text-accent transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-muted hover:text-red-500 transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 border border-border shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-main">
                {editingMemory ? 'Erinnerung bearbeiten' : 'Neue Erinnerung anlegen'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-subtle text-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editingMemory ? handleUpdateMemory : handleCreateMemory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1.5">Inhalt</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Z. B. Trinkt morgens immer Espresso..."
                  required
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1.5">Kategorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-subtle border border-border text-sm text-main focus:outline-none focus:border-accent"
                >
                  {CATEGORIES.filter((c) => c !== 'ALL').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1.5">
                  Vertrauensbewertung ({Math.round(newConfidence * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={newConfidence}
                  onChange={(e) => setNewConfidence(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-muted hover:bg-subtle"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newContent.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-accent text-white font-semibold text-xs shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
