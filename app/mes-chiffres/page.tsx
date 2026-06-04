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
  getNextDeclarationDeadline,
  getQuarterDateRange,
  getCurrentQuarter,
  THRESHOLDS,
} from '@/lib/calculations';
import { ExternalLink, ChevronDown, ChevronUp, Info } from 'lucide-react';

export default function MesChiffresPage() {
  const { profile, entries } = useStore();
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const now = new Date();

  const data = useMemo(() => {
    if (!profile) return null;
    let start: Date, end: Date;
    if (profile.declarationFrequency === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      const q = getCurrentQuarter(now);
      const r = getQuarterDateRange(now.getFullYear(), q);
      start = r.start; end = r.end;
    }
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd   = new Date(now.getFullYear(), 11, 31);
    const periodEntries  = filterEntriesByPeriod(entries, start, end);
    const allYearEntries = filterEntriesByPeriod(entries, yearStart, yearEnd);
    const summary  = calculatePeriodSummary(periodEntries, profile, allYearEntries);
    const label    = getDeclarationPeriodLabel(profile.declarationFrequency, now);
    const deadline = getNextDeclarationDeadline(profile.declarationFrequency, now);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Previous 3 periods
    const previousPeriods = Array.from({ length: 3 }, (_, i) => {
      let ps: Date, pe: Date, pl: string;
      if (profile.declarationFrequency === 'monthly') {
        const m = now.getMonth() - (i + 1);
        const y = now.getFullYear() + Math.floor(m / 12);
        const rm = ((m % 12) + 12) % 12;
        ps = new Date(y, rm, 1);
        pe = new Date(y, rm + 1, 0);
        pl = ps.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      } else {
        const q = getCurrentQuarter(now) - (i + 1);
        const rq = ((q - 1 + 4) % 4) + 1;
        const yo = q <= 0 ? -1 : 0;
        const r2 = getQuarterDateRange(now.getFullYear() + yo, rq);
        ps = r2.start; pe = r2.end;
        pl = `T${rq} ${now.getFullYear() + yo}`;
      }
      const pe2 = filterEntriesByPeriod(entries, ps, pe);
      const ch  = calculateCharges(pe2.reduce((s, e) => s + e.grossAmount, 0), profile);
      return { label: pl, ca: pe2.reduce((s, e) => s + e.grossAmount, 0), charges: ch.total, count: pe2.length };
    });

    return { summary, label, deadline, daysLeft, previousPeriods };
  }, [profile, entries, now.getMonth(), now.getFullYear()]);

  if (!profile || !data) return null;
  const { summary, label, deadline, daysLeft, previousPeriods } = data;
  const threshold = THRESHOLDS[profile.activityType];

  const dlColor = daysLeft <= 7 ? 'text-danger' : daysLeft <= 14 ? 'text-warning' : 'text-purple-light';
  const dlBg    = daysLeft <= 7 ? 'bg-danger/10 border-danger/30' : daysLeft <= 14 ? 'bg-warning/10 border-warning/30' : 'bg-purple-glow border-purple/30';

  const progressColor =
    summary.thresholdUsedPercent < 70 ? '#22C55E' :
    summary.thresholdUsedPercent < 90 ? '#F59E0B' : '#EF4444';

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Mes chiffres</h1>
          <p className="text-muted text-sm capitalize">{label}</p>
        </div>

        {/* Deadline */}
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${dlBg}`}>
          <span className={`text-2xl font-bold tabular-nums ${dlColor}`}>J-{daysLeft}</span>
          <div>
            <p className="text-text text-sm font-semibold">
              Déclaration avant le {deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
            <p className="text-muted text-xs">autoentrepreneur.urssaf.fr</p>
          </div>
        </div>

        {/* CA card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="p-5">
            <p className="text-muted text-xs uppercase tracking-widest mb-1">CA à déclarer</p>
            <p className="text-4xl font-bold text-text">{formatEur(summary.totalGross)}</p>
            <p className="text-muted text-xs mt-1">Saisissez ce chiffre sur l&apos;URSSAF</p>
          </div>
          <div className="border-t border-border px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-muted text-xs">Charges à payer</p>
              <p className="text-purple-light text-xl font-bold">{formatEur(summary.totalToSetAside)}</p>
            </div>
            <p className="text-muted text-xs text-right">Prélevées<br />automatiquement</p>
          </div>
        </div>

        {/* Detail toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full bg-surface border border-border rounded-2xl p-4 flex items-center justify-between"
        >
          <span className="text-text font-medium text-sm">Détail du calcul</span>
          {showDetails ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
        </button>

        {showDetails && (
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
            <Line label="CA brut" value={formatEurDecimal(summary.totalGross)} bold />
            {summary.totalFees > 0 && (
              <Line label="Frais plateformes" value={`−${formatEurDecimal(summary.totalFees)}`} dim sub="non déductibles du CA déclaré" />
            )}
            <div className="border-t border-border pt-2 mt-1">
              <Line label={`Cotisations sociales (${getRateLabel(profile.activityType, profile.hasACRE)})`} value={formatEurDecimal(summary.socialCharges)} danger />
              {profile.hasVersementLiberatoire && (
                <Line label="Versement libératoire" value={formatEurDecimal(summary.incomeTax)} danger />
              )}
            </div>
            <div className="border-t border-border pt-2 mt-1">
              <Line label="Total à mettre de côté" value={formatEurDecimal(summary.totalToSetAside)} purple />
              <Line label="Ce qu'il vous reste" value={formatEurDecimal(summary.netAfterCharges)} success />
            </div>
            <div className="bg-surface-2 rounded-xl p-3 mt-1 flex gap-2">
              <Info size={14} className="text-muted mt-0.5 shrink-0" />
              <p className="text-muted text-xs leading-relaxed">
                {profile.hasVersementLiberatoire
                  ? "Avec le versement libératoire, l'impôt est payé avec vos charges sociales sur votre CA brut."
                  : "Sans versement libératoire, l'impôt sur le revenu est déclaré séparément chaque année."}
              </p>
            </div>
          </div>
        )}

        {/* Annual threshold */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <div className="flex justify-between mb-3">
            <p className="text-text font-medium text-sm">Plafond annuel</p>
            <p className="text-muted text-xs">{formatEur(threshold)}</p>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${summary.thresholdUsedPercent}%`, backgroundColor: progressColor }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted">
            <span>{Math.round(summary.thresholdUsedPercent)}% utilisé</span>
            <span>{formatEur(Math.max(threshold - (threshold * summary.thresholdUsedPercent / 100), 0))} restant</span>
          </div>
        </div>

        {/* URSSAF CTA */}
        <a
          href="https://www.autoentrepreneur.urssaf.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
        >
          Déclarer sur l&apos;URSSAF
          <ExternalLink size={15} />
        </a>

        {/* History */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-surface border border-border rounded-2xl p-4 flex items-center justify-between"
        >
          <span className="text-text font-medium text-sm">Périodes précédentes</span>
          {showHistory ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
        </button>

        {showHistory && (
          <div className="flex flex-col gap-2">
            {previousPeriods.map((p) => (
              <div key={p.label} className="bg-surface border border-border rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-text text-sm font-medium capitalize">{p.label}</p>
                  <p className="text-muted text-xs">{p.count} encaissement{p.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-text font-semibold text-sm">{formatEur(p.ca)}</p>
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

function Line({ label, value, sub, bold, dim, danger, purple, success }: {
  label: string; value: string; sub?: string;
  bold?: boolean; dim?: boolean; danger?: boolean; purple?: boolean; success?: boolean;
}) {
  const vc = purple ? 'text-purple-light font-bold' : success ? 'text-success font-semibold' : danger ? 'text-danger font-medium' : dim ? 'text-muted' : bold ? 'text-text font-bold' : 'text-text';
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <div>
        <p className={`text-sm ${dim ? 'text-muted' : 'text-text/80'}`}>{label}</p>
        {sub && <p className="text-xs text-muted/60">{sub}</p>}
      </div>
      <p className={`text-sm tabular-nums shrink-0 ${vc}`}>{value}</p>
    </div>
  );
}

function getRateLabel(activityType: string, hasACRE: boolean): string {
  const rates: Record<string, string> = { services: '23,1%', sales: '12,3%', mixed: '~17,7%' };
  return `${rates[activityType] ?? '23,1%'}${hasACRE ? ' ACRE' : ''}`;
}
