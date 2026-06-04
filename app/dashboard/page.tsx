'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import DonutChart from '@/components/DonutChart';
import BarChart from '@/components/BarChart';
import {
  calculateCharges,
  filterEntriesByPeriod,
  formatEur,
  getNextDeclarationDeadline,
  THRESHOLDS,
} from '@/lib/calculations';
import { Plus, CalendarClock } from 'lucide-react';

const MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jui','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function DashboardPage() {
  const { profile, entries } = useStore();
  const now = new Date();

  const data = useMemo(() => {
    if (!profile) return null;

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEntries = filterEntriesByPeriod(entries, monthStart, monthEnd);
    const monthCA = monthEntries.reduce((s, e) => s + e.grossAmount, 0);
    const monthCharges = calculateCharges(monthCA, profile).total;

    // Annual
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd   = new Date(now.getFullYear(), 11, 31);
    const yearEntries = filterEntriesByPeriod(entries, yearStart, yearEnd);
    const yearCA = yearEntries.reduce((s, e) => s + e.grossAmount, 0);
    const threshold = THRESHOLDS[profile.activityType];
    const yearPct = Math.min((yearCA / threshold) * 100, 100);

    // Last 6 months bar chart
    const barData = Array.from({ length: 6 }, (_, i) => {
      const offset = 5 - i;
      const m = now.getMonth() - offset;
      const y = now.getFullYear() + Math.floor(m / 12);
      const realM = ((m % 12) + 12) % 12;
      const s = new Date(y, realM, 1);
      const e2 = new Date(y, realM + 1, 0);
      const ca = filterEntriesByPeriod(entries, s, e2).reduce((sum, e) => sum + e.grossAmount, 0);
      return { label: MONTH_LABELS[realM], value: ca };
    });

    const deadline = getNextDeclarationDeadline(profile.declarationFrequency, now);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return { monthCA, monthCharges, yearCA, yearPct, threshold, barData, daysLeft, deadline };
  }, [entries, profile, now.getMonth(), now.getFullYear()]);

  if (!profile || !data) return null;

  const { monthCA, monthCharges, yearCA, yearPct, threshold, barData, daysLeft, deadline } = data;

  const deadlineColor = daysLeft <= 7 ? 'text-danger' : daysLeft <= 14 ? 'text-warning' : 'text-purple-light';
  const deadlineBg    = daysLeft <= 7 ? 'bg-danger/10 border-danger/30' : daysLeft <= 14 ? 'bg-warning/10 border-warning/30' : 'bg-purple-glow border-purple/30';

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-6 flex flex-col gap-4">

        {/* Status bar */}
        <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 ${deadlineBg}`}>
          <CalendarClock size={15} className={deadlineColor} />
          <p className="text-text text-xs">
            Prochaine déclaration :{' '}
            <span className={`font-bold ${deadlineColor}`}>
              {deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </span>
          </p>
          <span className={`ml-auto text-xs font-bold tabular-nums ${deadlineColor}`}>J-{daysLeft}</span>
        </div>

        {/* Donut ring */}
        <div className="bg-surface rounded-3xl border border-border flex flex-col items-center py-6">
          <p className="text-muted text-xs uppercase tracking-widest mb-4">CA annuel {now.getFullYear()}</p>
          <DonutChart
            percent={yearPct}
            label={formatEur(yearCA)}
            sublabel={`/ ${formatEur(threshold)}`}
          />

          {/* Bar chart */}
          <div className="w-full px-4 mt-4">
            <p className="text-muted text-[10px] uppercase tracking-widest mb-3">6 derniers mois</p>
            <BarChart data={barData} activeIndex={5} />
          </div>
        </div>

        {/* Two stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Ce mois"
            value={formatEur(monthCA)}
            sub={now.toLocaleDateString('fr-FR', { month: 'long' })}
            accent={false}
          />
          <StatCard
            label="À mettre de côté"
            value={formatEur(monthCharges)}
            sub="charges estimées"
            accent
          />
        </div>

        {/* CTA */}
        <Link
          href="/income/new"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.35)',
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Ajouter un encaissement
        </Link>

      </div>
    </AppShell>
  );
}

function StatCard({
  label, value, sub, accent,
}: {
  label: string; value: string; sub: string; accent: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1"
      style={{
        background: accent ? 'rgba(139,92,246,0.08)' : '#1E1A2E',
        borderColor: accent ? 'rgba(139,92,246,0.35)' : '#2D2848',
      }}
    >
      <p className="text-muted text-[11px] font-medium">{label}</p>
      <p
        className="text-xl font-bold tabular-nums"
        style={{ color: accent ? '#A78BFA' : '#FAF5FF' }}
      >
        {value}
      </p>
      <p className="text-muted text-[10px] capitalize">{sub}</p>
    </div>
  );
}
