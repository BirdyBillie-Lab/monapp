'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import DonutChart from '@/components/DonutChart';
import {
  filterEntriesByPeriod,
  formatEur,
  formatEurDecimal,
  getNextDeclarationDeadline,
  getACREStatus,
  getEntryLines,
} from '@/lib/calculations';
import { UserProfile } from '@/lib/types';
import { Plus, Bell, AlertTriangle, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { profile, entries } = useStore();
  const now = new Date();

  const data = useMemo(() => {
    if (!profile) return null;

    // This month entries + per-category CA
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEntries = filterEntriesByPeriod(entries, monthStart, monthEnd);
    const monthCA = monthEntries.reduce((s, e) => s + e.grossAmount, 0);

    // Per-category breakdown from line items
    const allLines = monthEntries.flatMap(getEntryLines);
    const servicesCA = allLines.filter(l => l.category === 'services').reduce((s, l) => s + l.amount, 0);
    const salesCA    = allLines.filter(l => l.category === 'sales').reduce((s, l) => s + l.amount, 0);
    const servicesPct = monthCA > 0 ? Math.round((servicesCA / monthCA) * 100) : 0;
    const salesPct    = monthCA > 0 ? Math.round((salesCA    / monthCA) * 100) : 0;

    // Declaration deadline
    const deadline = getNextDeclarationDeadline(profile.declarationFrequency, now);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Monthly objective
    const objective     = profile.monthlyObjective ?? 0;
    const objProgress   = objective > 0 ? Math.min((monthCA / objective) * 100, 100) : 0;
    const objRemaining  = Math.max((objective || 0) - monthCA, 0);
    const daysInMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeftMonth = daysInMonth - now.getDate();
    const monthName     = now.toLocaleDateString('fr-FR', { month: 'long' });

    return {
      monthCA, servicesCA, salesCA, servicesPct, salesPct,
      deadline, daysLeft, objective, objProgress, objRemaining,
      daysLeftMonth, monthName,
    };
  }, [entries, profile, now.getMonth(), now.getFullYear()]);

  if (!profile || !data) return null;

  const {
    monthCA, servicesCA, salesCA, servicesPct, salesPct,
    deadline, daysLeft, objective, objProgress, objRemaining,
    daysLeftMonth, monthName,
  } = data;

  const greeting = profile.name ? `Bonjour, ${profile.name}` : 'Bonjour';
  const deadlineFmt = deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const dlColor = daysLeft <= 7 ? '#EF4444' : daysLeft <= 14 ? '#F59E0B' : '#22C55E';

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-6 flex flex-col gap-4">

        {/* Greeting + bell */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text text-2xl font-bold">{greeting}</p>
            <p className="text-muted text-sm capitalize">{monthName} {now.getFullYear()}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
            <Bell size={18} className="text-muted" />
          </button>
        </div>

        {/* Declaration reminder — green when plenty of time */}
        <div className="flex items-center gap-3 rounded-2xl border px-4 py-2.5"
          style={{
            background: `${dlColor}10`,
            borderColor: `${dlColor}40`,
          }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dlColor }} />
          <p className="text-text text-xs flex-1">
            Prochaine déclaration :{' '}
            <span className="font-semibold" style={{ color: dlColor }}>{deadlineFmt}</span>
          </p>
          <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: dlColor }}>
            J-{daysLeft}
          </span>
        </div>

        {/* ACRE alert (if relevant) */}
        <AcreBanner profile={profile} />

        {/* CTA */}
        <Link href="/income/new"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Ajouter un encaissement
        </Link>

        {/* Donut + legend */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-muted text-xs uppercase tracking-widest mb-4">Répartition du mois</p>
          <div className="flex items-center gap-4">
            {/* Donut */}
            <DonutChart
              servicesCA={servicesCA}
              salesCA={salesCA}
              centerLabel={formatEur(monthCA)}
              centerSub="CA du mois"
            />

            {/* Legend */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Services */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#8B5CF6' }} />
                  <span className="text-muted text-xs leading-tight">Prestations de services</span>
                </div>
                <p className="text-text font-bold text-base tabular-nums pl-4">
                  {formatEur(servicesCA)}
                </p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md w-fit ml-4"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>
                  {servicesPct}%
                </span>
              </div>

              <div className="h-px bg-border" />

              {/* Sales */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#F59E0B' }} />
                  <span className="text-muted text-xs leading-tight">Vente de marchandises</span>
                </div>
                <p className="text-text font-bold text-base tabular-nums pl-4">
                  {formatEur(salesCA)}
                </p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md w-fit ml-4"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  {salesPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly objective */}
        {objective > 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-muted text-xs uppercase tracking-widest">Objectif du mois</p>
                <p className="text-text text-lg font-bold tabular-nums mt-0.5">
                  {formatEur(monthCA)}{' '}
                  <span className="text-muted text-sm font-normal">/ {formatEur(objective)}</span>
                </p>
              </div>
              <Link href="/settings" className="flex items-center gap-0.5 text-purple-light text-xs font-medium mt-1">
                Modifier <ChevronRight size={13} />
              </Link>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden mb-3">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${objProgress}%`,
                  background: objProgress >= 100
                    ? '#22C55E'
                    : 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                }}
              />
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: objProgress >= 100 ? 'rgba(34,197,94,0.15)' : 'rgba(139,92,246,0.15)',
                    color: objProgress >= 100 ? '#22C55E' : '#A78BFA',
                  }}>
                  {Math.round(objProgress)}%
                </span>
                <span className="text-muted text-xs">J-{daysLeftMonth} dans le mois</span>
              </div>
              {objRemaining > 0 && (
                <p className="text-muted text-xs">
                  Il reste <span className="text-text font-semibold">{formatEur(objRemaining)}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          // No objective set
          <Link href="/settings"
            className="bg-surface border border-dashed border-border rounded-2xl px-5 py-4 flex items-center justify-between"
          >
            <div>
              <p className="text-text text-sm font-medium">Définir un objectif mensuel</p>
              <p className="text-muted text-xs mt-0.5">Suivez votre progression chaque mois</p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        )}

        {/* Motivational message */}
        <div className="bg-surface border border-border rounded-2xl px-4 py-3.5">
          <p className="text-muted text-xs leading-relaxed italic">
            {getMotivationalMessage(monthCA, objective, daysLeftMonth, monthName)}
          </p>
        </div>

      </div>
    </AppShell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMotivationalMessage(
  monthCA: number,
  objective: number,
  daysLeft: number,
  monthName: string
): string {
  if (monthCA === 0) return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} commence — enregistrez votre premier encaissement.`;
  if (objective === 0) return "Définissez un objectif mensuel pour suivre votre progression au fil du temps.";
  const pct = (monthCA / objective) * 100;
  if (pct >= 100) return "Objectif du mois atteint — chaque euro supplémentaire est un bonus bien mérité.";
  if (pct >= 80) return "Presque là. Encore quelques missions et l'objectif est dans la poche.";
  if (pct >= 50 && daysLeft <= 10) return "Bonne dynamique — sprint final pour finir le mois fort.";
  if (pct >= 50) return "Vous êtes sur la bonne voie. Continuez comme ça.";
  if (daysLeft <= 7) return "Dernière ligne droite — chaque encaissement compte.";
  return "Chaque encaissement vous rapproche de votre objectif mensuel.";
}

function AcreBanner({ profile }: { profile: UserProfile }) {
  const status = getACREStatus(profile);
  if (status.alertLevel === 'none') return null;
  const endLabel = status.endDate?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) ?? '';

  if (status.alertLevel === 'expired') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
        <div className="w-2 h-2 rounded-full bg-muted mt-1.5 shrink-0" />
        <div>
          <p className="text-text text-sm font-medium">L&apos;ACRE est terminée</p>
          <p className="text-muted text-xs mt-0.5 leading-relaxed">
            Depuis le {endLabel}, vos cotisations sont revenues à leur taux normal. Pensez à mettre de côté davantage.
          </p>
        </div>
      </div>
    );
  }
  if (status.alertLevel === 'warning_1month') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-warning/35 bg-warning/8 px-4 py-3">
        <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
        <div>
          <p className="text-warning text-sm font-semibold">
            L&apos;ACRE se termine dans {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''}
          </p>
          <p className="text-warning/70 text-xs mt-0.5">
            À partir du {endLabel}, vos charges sociales augmenteront. Anticipez dès maintenant.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/6 px-4 py-3">
      <AlertTriangle size={16} className="text-warning/80 mt-0.5 shrink-0" />
      <div>
        <p className="text-text text-sm font-medium">
          L&apos;ACRE se termine dans <span className="text-warning font-semibold">{status.monthsRemaining} mois</span>
        </p>
        <p className="text-muted text-xs mt-0.5">Fin le {endLabel} — préparez-vous à mettre davantage de côté.</p>
      </div>
    </div>
  );
}
