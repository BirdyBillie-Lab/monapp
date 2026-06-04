'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import {
  calculateCharges,
  calculatePeriodSummary,
  filterEntriesByPeriod,
  formatEur,
  formatEurDecimal,
  getDeclarationPeriodLabel,
  getQuarterDateRange,
  getCurrentQuarter,
  THRESHOLDS,
} from '@/lib/calculations';
import { Info, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function DeclarationPage() {
  const { profile, entries } = useStore();
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const now = new Date();

  const declarationData = useMemo(() => {
    if (!profile) return null;

    let start: Date, end: Date;

    if (profile.declarationFrequency === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      const q = getCurrentQuarter(now);
      const range = getQuarterDateRange(now.getFullYear(), q);
      start = range.start;
      end = range.end;
    }

    const periodEntries = filterEntriesByPeriod(entries, start, end);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const allYearEntries = filterEntriesByPeriod(entries, yearStart, yearEnd);

    const summary = calculatePeriodSummary(periodEntries, profile, allYearEntries);
    const label = getDeclarationPeriodLabel(profile.declarationFrequency, now);

    // Previous periods for history
    const previousPeriods = [];
    for (let i = 1; i <= 3; i++) {
      let pStart: Date, pEnd: Date, pLabel: string;
      if (profile.declarationFrequency === 'monthly') {
        const m = now.getMonth() - i;
        const y = now.getFullYear() + Math.floor(m / 12);
        const realM = ((m % 12) + 12) % 12;
        pStart = new Date(y, realM, 1);
        pEnd = new Date(y, realM + 1, 0);
        pLabel = pStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      } else {
        const q = getCurrentQuarter(now) - i;
        const realQ = ((q - 1 + 4) % 4) + 1;
        const yearOffset = q <= 0 ? -1 : 0;
        const range = getQuarterDateRange(now.getFullYear() + yearOffset, realQ);
        pStart = range.start;
        pEnd = range.end;
        pLabel = `T${realQ} ${now.getFullYear() + yearOffset}`;
      }
      const pEntries = filterEntriesByPeriod(entries, pStart, pEnd);
      const pCharges = calculateCharges(
        pEntries.reduce((s, e) => s + e.grossAmount, 0),
        profile
      );
      previousPeriods.push({
        label: pLabel,
        ca: pEntries.reduce((s, e) => s + e.grossAmount, 0),
        charges: pCharges.total,
        count: pEntries.length,
      });
    }

    return { summary, label, start, end, previousPeriods };
  }, [profile, entries, now.getMonth(), now.getFullYear()]);

  if (!profile || !declarationData) return null;

  const { summary, label, previousPeriods } = declarationData;
  const threshold = THRESHOLDS[profile.activityType];

  const deadline = getNextDeadline(profile.declarationFrequency, now);
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Déclaration</h1>
          <p className="text-muted text-sm capitalize">{label}</p>
        </div>

        {/* Deadline banner */}
        <div className={`rounded-2xl border p-4 mb-4 flex items-center gap-3
          ${daysLeft <= 7 ? 'bg-danger/10 border-danger/40' : daysLeft <= 14 ? 'bg-warning/10 border-warning/40' : 'bg-surface-2 border-border'}`}>
          <div className={`text-2xl font-bold tabular-nums ${daysLeft <= 7 ? 'text-danger' : daysLeft <= 14 ? 'text-warning' : 'text-purple'}`}>
            J-{daysLeft}
          </div>
          <div>
            <p className="text-white text-sm font-semibold">
              Déclaration à déposer avant le {deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
            <p className="text-muted text-xs">Sur votre espace autoentrepreneur.urssaf.fr</p>
          </div>
        </div>

        {/* Main declaration card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4">
          <div className="p-5">
            <p className="text-muted text-xs uppercase tracking-wider mb-1">CA à déclarer</p>
            <p className="text-4xl font-bold text-white">{formatEur(summary.totalGross)}</p>
            <p className="text-muted text-xs mt-1">
              C&apos;est ce chiffre que vous saisissez sur l&apos;URSSAF
            </p>
          </div>
          <div className="border-t border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted text-xs">Charges à payer</p>
                <p className="text-purple text-xl font-bold">{formatEur(summary.totalToSetAside)}</p>
              </div>
              <div className="text-right">
                <p className="text-muted text-xs">Prélevées automatiquement</p>
                <p className="text-white/60 text-sm">après déclaration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full bg-surface-2 border border-border rounded-2xl p-4 flex items-center justify-between mb-4"
        >
          <span className="text-white font-medium text-sm">Détail du calcul</span>
          {showDetails ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
        </button>

        {showDetails && (
          <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-4 space-y-3">
            <LineItem
              label="Chiffre d'affaires brut"
              value={formatEurDecimal(summary.totalGross)}
              highlight
            />
            {summary.totalFees > 0 && (
              <LineItem
                label={`Frais plateformes`}
                value={`−${formatEurDecimal(summary.totalFees)}`}
                sub="non déductibles du CA déclaré"
                muted
              />
            )}
            <div className="border-t border-border pt-3">
              <LineItem
                label={`Cotisations sociales (${getSocialRateLabel(profile.activityType, profile.hasACRE)})`}
                value={formatEurDecimal(summary.socialCharges)}
                danger
              />
              {profile.hasVersementLiberatoire && (
                <LineItem
                  label="Versement libératoire (impôt)"
                  value={formatEurDecimal(summary.incomeTax)}
                  danger
                  sub="inclus dans votre déclaration URSSAF"
                />
              )}
            </div>
            <div className="border-t border-border pt-3">
              <LineItem
                label="Total à mettre de côté"
                value={formatEurDecimal(summary.totalToSetAside)}
                purple
              />
              <LineItem
                label="Ce qu'il vous reste"
                value={formatEurDecimal(summary.netAfterCharges)}
                success
              />
            </div>
            <div className="bg-surface-3 rounded-xl p-3 mt-2">
              <div className="flex gap-2">
                <Info size={14} className="text-muted mt-0.5 shrink-0" />
                <p className="text-muted text-xs leading-relaxed">
                  {profile.hasVersementLiberatoire
                    ? 'Avec le versement libératoire, l\'impôt sur le revenu est payé en même temps que vos charges sociales. Votre taux est calculé sur votre CA brut déclaré.'
                    : 'Sans versement libératoire, l\'impôt sur le revenu est calculé et payé séparément via votre déclaration annuelle de revenus.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Annual progress */}
        <div className="bg-surface-2 border border-border rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-medium text-sm">Plafond annuel</p>
            <p className="text-muted text-xs">{formatEur(threshold)}</p>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${summary.thresholdUsedPercent}%`,
                backgroundColor:
                  summary.thresholdUsedPercent < 70
                    ? '#22C55E'
                    : summary.thresholdUsedPercent < 90
                    ? '#F59E0B'
                    : '#EF4444',
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>{Math.round(summary.thresholdUsedPercent)}% utilisé</span>
            <span>{formatEur(threshold - (threshold * summary.thresholdUsedPercent) / 100)} restant</span>
          </div>
        </div>

        {/* CTA URSSAF */}
        <a
          href="https://www.autoentrepreneur.urssaf.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 rounded-2xl bg-purple text-white font-bold text-base flex items-center justify-center gap-2 mb-4"
        >
          Déclarer sur l&apos;URSSAF
          <ExternalLink size={16} />
        </a>

        {/* Previous periods */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-surface-2 border border-border rounded-2xl p-4 flex items-center justify-between mb-2"
        >
          <span className="text-white font-medium text-sm">Périodes précédentes</span>
          {showHistory ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
        </button>

        {showHistory && (
          <div className="space-y-2">
            {previousPeriods.map((p) => (
              <div key={p.label} className="bg-surface-2 border border-border rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-medium capitalize">{p.label}</p>
                  <p className="text-muted text-xs">{p.count} encaissement{p.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{formatEur(p.ca)}</p>
                  <p className="text-muted text-xs">charges: {formatEur(p.charges)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LineItem({
  label,
  value,
  sub,
  highlight,
  muted,
  danger,
  purple,
  success,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  muted?: boolean;
  danger?: boolean;
  purple?: boolean;
  success?: boolean;
}) {
  const valueClass = purple
    ? 'text-purple font-bold'
    : success
    ? 'text-success font-semibold'
    : danger
    ? 'text-danger font-medium'
    : muted
    ? 'text-muted'
    : highlight
    ? 'text-white font-bold'
    : 'text-white';

  return (
    <div className="flex items-start justify-between gap-2 py-1">
      <div>
        <p className={`text-sm ${muted ? 'text-muted' : 'text-white/80'}`}>{label}</p>
        {sub && <p className="text-xs text-muted/60">{sub}</p>}
      </div>
      <p className={`text-sm tabular-nums shrink-0 ${valueClass}`}>{value}</p>
    </div>
  );
}

function getSocialRateLabel(activityType: string, hasACRE: boolean): string {
  const rates: Record<string, string> = {
    services: hasACRE ? '11,55%' : '23,1%',
    sales: hasACRE ? '6,15%' : '12,3%',
    mixed: hasACRE ? '~8,85%' : '~17,7%',
  };
  const label = rates[activityType] ?? '23,1%';
  return `${label}${hasACRE ? ' ACRE' : ''}`;
}

function getNextDeadline(frequency: 'monthly' | 'quarterly', now: Date): Date {
  if (frequency === 'monthly') {
    // Due by the 31st of the following month (in France, last day of next month)
    const next = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return next;
  } else {
    // Quarterly: due by the last day of the month following the quarter end
    const q = getCurrentQuarter(now);
    const quarterEndMonth = q * 3; // April, July, October, January
    return new Date(now.getFullYear(), quarterEndMonth, 31 > getDaysInMonth(now.getFullYear(), quarterEndMonth) ? getDaysInMonth(now.getFullYear(), quarterEndMonth) : 31);
  }
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
