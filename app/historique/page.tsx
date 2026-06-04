'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { filterEntriesByPeriod, formatEur } from '@/lib/calculations';
import { Check } from 'lucide-react';

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

function declarationDeadline(year: number, month: number): Date {
  // End of following month
  return new Date(year, month + 1, 0);
}

export default function HistoriquePage() {
  const { profile, entries } = useStore();
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Available years: from first entry year up to current year
  const availableYears = useMemo(() => {
    if (entries.length === 0) return [currentYear];
    const years = new Set(entries.map(e => new Date(e.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [entries, currentYear]);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Global stats (all time)
  const globalStats = useMemo(() => {
    const totalCA = entries.reduce((s, e) => s + e.grossAmount, 0);

    // Count past declaration periods (months before current month)
    const firstEntry = entries.length > 0
      ? new Date(entries.reduce((a, b) => a.date < b.date ? a : b).date)
      : now;
    const firstYear  = firstEntry.getFullYear();
    const firstMonth = firstEntry.getMonth();

    // Months elapsed from first entry to last completed month
    const totalMonths =
      (currentYear - firstYear) * 12 + (currentMonth - firstMonth);
    const completedDeclarations = Math.max(totalMonths, 0);
    const monthlyAvg = totalMonths > 0 ? totalCA / totalMonths : totalCA;

    return { totalCA, completedDeclarations, monthlyAvg };
  }, [entries, currentYear, currentMonth]);

  // Year summary
  const yearCA = useMemo(() => {
    const start = new Date(selectedYear, 0, 1);
    const end   = new Date(selectedYear, 11, 31);
    return filterEntriesByPeriod(entries, start, end)
      .reduce((s, e) => s + e.grossAmount, 0);
  }, [entries, selectedYear]);

  // Monthly rows for selected year
  const monthRows = useMemo(() => {
    return MONTHS_FR.map((name, m) => {
      const start = new Date(selectedYear, m, 1);
      const end   = new Date(selectedYear, m + 1, 0);
      const ca    = filterEntriesByPeriod(entries, start, end)
        .reduce((s, e) => s + e.grossAmount, 0);
      const deadline = declarationDeadline(selectedYear, m);
      // A month is "declared" if it's fully past (strictly before current month/year)
      const isPast =
        selectedYear < currentYear ||
        (selectedYear === currentYear && m < currentMonth);
      const isCurrent = selectedYear === currentYear && m === currentMonth;
      const isFuture  = selectedYear === currentYear ? m > currentMonth : selectedYear > currentYear;

      return { name, m, ca, deadline, isPast, isCurrent, isFuture };
    });
  }, [entries, selectedYear, currentYear, currentMonth]);

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-4">

        <h1 className="text-2xl font-bold text-text">Historique</h1>

        {/* Global summary card */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-muted text-xs uppercase tracking-widest mb-4">Depuis le début</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-text text-lg font-bold tabular-nums">{formatEur(globalStats.totalCA)}</p>
              <p className="text-muted text-[10px] mt-0.5">CA total</p>
            </div>
            <div className="border-x border-border">
              <p className="text-text text-lg font-bold tabular-nums">{globalStats.completedDeclarations}</p>
              <p className="text-muted text-[10px] mt-0.5">Déclaration{globalStats.completedDeclarations !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-text text-lg font-bold tabular-nums">{formatEur(globalStats.monthlyAvg)}</p>
              <p className="text-muted text-[10px] mt-0.5">Moy. / mois</p>
            </div>
          </div>
        </div>

        {/* Year filter */}
        <div className="flex gap-2">
          {availableYears.map(y => (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all
                ${selectedYear === y
                  ? 'text-white'
                  : 'bg-surface border border-border text-muted'
                }`}
              style={selectedYear === y ? {
                background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                boxShadow: '0 2px 12px rgba(139,92,246,0.35)',
              } : {}}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Year total */}
        <div className="flex items-center justify-between px-1">
          <p className="text-muted text-sm">CA {selectedYear}</p>
          <p className="text-purple-light font-bold text-lg tabular-nums">{formatEur(yearCA)}</p>
        </div>

        {/* Monthly rows */}
        <div className="flex flex-col gap-2">
          {monthRows.map(({ name, m, ca, deadline, isPast, isCurrent, isFuture }) => {
            // Skip future months with no data
            if (isFuture && ca === 0) return null;

            return (
              <div
                key={m}
                className={`bg-surface border rounded-2xl p-4 flex items-center gap-3
                  ${isCurrent ? 'border-purple/40' : 'border-border'}`}
              >
                {/* Month + deadline */}
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-semibold">{name}</p>
                  <p className="text-muted text-xs mt-0.5">
                    {isPast
                      ? `Déclaré avant le ${deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                      : `À déclarer avant le ${deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                    }
                  </p>
                </div>

                {/* CA */}
                <p className={`text-sm font-bold tabular-nums ${ca === 0 ? 'text-muted' : 'text-text'}`}>
                  {formatEur(ca)}
                </p>

                {/* Badge */}
                {isPast ? (
                  <div className="flex items-center gap-1 bg-success/10 border border-success/30 rounded-full px-2.5 py-1 shrink-0">
                    <Check size={11} className="text-success" strokeWidth={2.5} />
                    <span className="text-success text-[10px] font-bold">Déclaré</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 rounded-full px-2.5 py-1 shrink-0"
                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)' }}>
                    <span className="text-purple-light text-[10px] font-bold">À déclarer</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </AppShell>
  );
}
