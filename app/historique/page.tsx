'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { INCOME_CATEGORIES, PLATFORM_FEES } from '@/lib/types';
import { formatEur } from '@/lib/calculations';
import { Trash2, Search } from 'lucide-react';

const EMOJI: Record<string, string> = {
  prestation: '🔧', consulting: '💼', formation: '📚',
  vente_produit: '📦', marketplace: '🛍️', autre: '💳',
};

export default function HistoriquePage() {
  const { entries, deleteEntry } = useStore();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const q = search.toLowerCase();
    return [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((e) =>
        !q ||
        e.description.toLowerCase().includes(q) ||
        INCOME_CATEGORIES[e.category].toLowerCase().includes(q)
      );
  }, [entries, search]);

  // Group by month
  const grouped = useMemo(() => {
    const map = new Map<string, typeof sorted>();
    for (const e of sorted) {
      const key = e.date.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const d = new Date(key + '-01');
      const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const total = items.reduce((s, e) => s + e.grossAmount, 0);
      return { label, items, total };
    });
  }, [sorted]);

  const totalAll = entries.reduce((s, e) => s + e.grossAmount, 0);

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Historique</h1>
          <p className="text-muted text-sm">{entries.length} encaissement{entries.length !== 1 ? 's' : ''} · {formatEur(totalAll)} total</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl pl-10 pr-4 py-3 text-text text-sm placeholder-muted focus:border-purple transition-colors"
          />
        </div>

        {entries.length === 0 ? (
          <div className="bg-surface rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-text/60 text-sm">Aucun encaissement enregistré.</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center">
            <p className="text-muted text-sm">Aucun résultat pour « {search} »</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map(({ label, items, total }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-muted text-xs uppercase tracking-widest font-medium capitalize">{label}</p>
                  <p className="text-purple-light text-xs font-semibold">{formatEur(total)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((entry) => (
                    <div key={entry.id} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center text-lg shrink-0">
                        {EMOJI[entry.category] ?? '💳'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text text-sm font-medium truncate">{entry.description}</p>
                        <p className="text-muted text-xs mt-0.5">
                          {new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          {' · '}
                          {INCOME_CATEGORIES[entry.category]}
                          {entry.platformFeeRate > 0 && ` · ${PLATFORM_FEES[entry.paymentMethod]?.label}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-text font-semibold text-sm">{formatEur(entry.grossAmount)}</p>
                        {entry.platformFeeAmount > 0 && (
                          <p className="text-muted text-xs">net: {formatEur(entry.netAmount)}</p>
                        )}
                      </div>
                      <button onClick={() => setDeleteId(entry.id)} className="text-muted hover:text-danger transition-colors ml-1">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-2 rounded-t-3xl p-6">
            <h3 className="text-text font-bold text-lg mb-2">Supprimer cette entrée ?</h3>
            <p className="text-muted text-sm mb-6">Cette action est irréversible.</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { deleteEntry(deleteId); setDeleteId(null); }}
                className="w-full py-3.5 rounded-2xl bg-danger text-white font-bold">
                Supprimer
              </button>
              <button onClick={() => setDeleteId(null)}
                className="w-full py-3.5 rounded-2xl bg-surface-3 text-text font-semibold">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
