'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import {
  calculatePeriodSummary,
  filterEntriesByPeriod,
  formatEur,
  getHealthStatus,
  getQuarterDateRange,
  getCurrentQuarter,
  THRESHOLDS,
} from '@/lib/calculations';
import { INCOME_CATEGORIES, PLATFORM_FEES } from '@/lib/types';
import { Trash2, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';

type ViewMode = 'month' | 'quarter' | 'year';

export default function DashboardPage() {
  const { profile, entries, deleteEntry } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);

  const now = new Date();

  const { periodEntries, allYearEntries, periodLabel } = useMemo(() => {
    let start: Date, end: Date, label: string;

    if (viewMode === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'quarter') {
      const q = getCurrentQuarter(now);
      const range = getQuarterDateRange(now.getFullYear(), q);
      start = range.start;
      end = range.end;
      label = `T${q} ${now.getFullYear()}`;
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      label = String(now.getFullYear());
    }

    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);

    return {
      periodEntries: filterEntriesByPeriod(entries, start, end),
      allYearEntries: filterEntriesByPeriod(entries, yearStart, yearEnd),
      periodLabel: label,
    };
  }, [entries, viewMode, now.getMonth(), now.getFullYear()]);

  const summary = useMemo(() => {
    if (!profile) return null;
    return calculatePeriodSummary(periodEntries, profile, allYearEntries);
  }, [periodEntries, profile, allYearEntries]);

  if (!profile || !summary) return null;

  const health = getHealthStatus(summary.thresholdUsedPercent);
  const healthColors = { green: '#22C55E', orange: '#F59E0B', red: '#EF4444' };
  const healthLabels = { green: 'Activité saine', orange: 'Attention au plafond', red: 'Plafond proche' };
  const healthBg = { green: 'bg-success/10 border-success/30', orange: 'bg-warning/10 border-warning/30', red: 'bg-danger/10 border-danger/30' };
  const healthText = { green: 'text-success', orange: 'text-warning', red: 'text-danger' };

  const threshold = THRESHOLDS[profile.activityType];

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
            <p className="text-muted text-sm capitalize">{periodLabel}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-gold font-bold text-sm">C</span>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 mb-6">
          {(['month', 'quarter', 'year'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                ${viewMode === mode ? 'bg-gold text-bg' : 'bg-surface-2 text-muted'}`}
            >
              {mode === 'month' ? 'Mois' : mode === 'quarter' ? 'Trimestre' : 'Année'}
            </button>
          ))}
        </div>

        {/* Revenue hero card */}
        <div className="bg-surface rounded-2xl border border-border p-5 mb-4">
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-1">
            Chiffre d&apos;affaires
          </p>
          <p className="text-4xl font-bold text-white mb-1">{formatEur(summary.totalGross)}</p>
          {summary.totalFees > 0 && (
            <p className="text-xs text-muted">
              dont {formatEur(summary.totalFees)} de frais plateformes
            </p>
          )}
          <div className="flex gap-4 mt-4">
            <div>
              <p className="text-muted text-xs">Net reçu</p>
              <p className="text-white font-semibold">{formatEur(summary.totalNet)}</p>
            </div>
            <div className="w-px bg-border" />
            <div>
              <p className="text-muted text-xs">Après charges</p>
              <p className="text-success font-semibold">{formatEur(summary.netAfterCharges)}</p>
            </div>
          </div>
        </div>

        {/* Set aside card */}
        <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gold text-xs font-medium uppercase tracking-wider mb-1">
                À mettre de côté
              </p>
              <p className="text-3xl font-bold text-gold">{formatEur(summary.totalToSetAside)}</p>
              <p className="text-gold/60 text-xs mt-1">pour votre prochaine déclaration</p>
            </div>
            <div className="text-right">
              <p className="text-muted text-xs">Charges sociales</p>
              <p className="text-white text-sm font-medium">{formatEur(summary.socialCharges)}</p>
              {profile.hasVersementLiberatoire && (
                <>
                  <p className="text-muted text-xs mt-1">Impôt (VL)</p>
                  <p className="text-white text-sm font-medium">{formatEur(summary.incomeTax)}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Health indicator */}
        <div className={`rounded-2xl border p-4 mb-4 ${healthBg[health]}`}>
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full health-pulse"
              style={{ backgroundColor: healthColors[health] }}
            />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${healthText[health]}`}>
                {healthLabels[health]}
              </p>
              <p className="text-muted text-xs mt-0.5">
                {formatEur(allYearEntries.reduce((s, e) => s + e.grossAmount, 0))} /
                {' '}{formatEur(threshold)} annuel
              </p>
            </div>
            <p className={`text-lg font-bold ${healthText[health]}`}>
              {Math.round(summary.thresholdUsedPercent)}%
            </p>
          </div>
          {/* Threshold bar */}
          <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${summary.thresholdUsedPercent}%`,
                backgroundColor: healthColors[health],
              }}
            />
          </div>
        </div>

        {/* Recent entries */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Encaissements récents</h2>
            <span className="text-muted text-xs">{periodEntries.length} entrée{periodEntries.length !== 1 ? 's' : ''}</span>
          </div>

          {periodEntries.length === 0 ? (
            <div className="bg-surface-2 rounded-2xl p-8 text-center">
              <p className="text-4xl mb-3">💸</p>
              <p className="text-white/60 text-sm">Aucun encaissement pour cette période.</p>
              <p className="text-muted text-xs mt-1">Appuyez sur « Encaisser » pour ajouter une entrée.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {periodEntries.slice(0, 20).map((entry) => (
                <div key={entry.id} className="relative">
                  <div
                    className="bg-surface-2 rounded-2xl p-4 flex items-center gap-3 card-press"
                    onTouchStart={() => {}}
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center text-lg shrink-0">
                      {getCategoryEmoji(entry.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{entry.description}</p>
                      <p className="text-muted text-xs">
                        {new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {' · '}
                        {INCOME_CATEGORIES[entry.category]}
                        {entry.platformFeeRate > 0 && (
                          <span> · {PLATFORM_FEES[entry.paymentMethod]?.label}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white font-semibold text-sm">{formatEur(entry.grossAmount)}</p>
                      {entry.platformFeeAmount > 0 && (
                        <p className="text-muted text-xs">net: {formatEur(entry.netAmount)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setShowDeleteId(entry.id)}
                      className="ml-1 text-muted hover:text-danger transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteId && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-2 rounded-t-3xl p-6">
            <h3 className="text-white font-bold text-lg mb-2">Supprimer cette entrée ?</h3>
            <p className="text-muted text-sm mb-6">Cette action est irréversible.</p>
            <div className="space-y-2">
              <button
                onClick={() => { deleteEntry(showDeleteId); setShowDeleteId(null); }}
                className="w-full py-3.5 rounded-2xl bg-danger text-white font-bold"
              >
                Supprimer
              </button>
              <button
                onClick={() => setShowDeleteId(null)}
                className="w-full py-3.5 rounded-2xl bg-surface-3 text-white font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    prestation: '🔧',
    consulting: '💼',
    formation: '📚',
    vente_produit: '📦',
    marketplace: '🛍️',
    autre: '💳',
  };
  return map[cat] ?? '💳';
}
