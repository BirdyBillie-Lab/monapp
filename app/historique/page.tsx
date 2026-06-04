'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { filterEntriesByPeriod, formatEur, formatEurDecimal } from '@/lib/calculations';
import { Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const MONTHS_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];

// ─── Deadline logic ────────────────────────────────────────────────────────────

function getMonthDeadline(
  year: number,
  month: number, // 0-indexed
  frequency: 'monthly' | 'quarterly'
): Date {
  if (frequency === 'monthly') {
    // Declare month M before end of month M+1
    // new Date(y, m+2, 0) = last day of month M+1
    return new Date(year, month + 2, 0);
  }
  // Quarterly: each month's deadline is the end of the month following its quarter
  const quarter = Math.floor(month / 3); // 0=Q1, 1=Q2, 2=Q3, 3=Q4
  const deadlineMonth = (quarter + 1) * 3; // 3=Apr, 6=Jul, 9=Oct, 12=Jan
  if (deadlineMonth === 12) return new Date(year + 1, 1, 0); // Jan 31 next year
  return new Date(year, deadlineMonth + 1, 0);
}

// ─── Bar chart ─────────────────────────────────────────────────────────────────

function MonthlyBarChart({
  monthlyCA,
  currentMonth,
  selectedYear,
  currentYear,
}: {
  monthlyCA: number[];
  currentMonth: number;
  selectedYear: number;
  currentYear: number;
}) {
  const max = Math.max(...monthlyCA, 1);

  // Y-axis labels: 0, mid, max
  const yLabels = [max, max / 2, 0].map(v =>
    v === 0 ? '0' : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
  );

  return (
    <div className="flex gap-2">
      {/* Y-axis */}
      <div className="flex flex-col justify-between pb-5 text-right w-8 shrink-0">
        {yLabels.map((l, i) => (
          <span key={i} className="text-muted text-[9px] tabular-nums leading-none">{l}</span>
        ))}
      </div>

      {/* Bars */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-end gap-[3px] h-24">
          {monthlyCA.map((ca, m) => {
            const heightPct = max > 0 ? (ca / max) * 100 : 0;
            const isCurrent = selectedYear === currentYear && m === currentMonth;
            const isFuture  = selectedYear === currentYear ? m > currentMonth : selectedYear > currentYear;
            const isEmpty   = ca === 0;

            let barStyle: React.CSSProperties;
            if (isCurrent) {
              barStyle = { background: 'linear-gradient(to top, #8B5CF6, #A78BFA)', boxShadow: '0 0 8px rgba(139,92,246,0.5)' };
            } else if (isFuture || isEmpty) {
              barStyle = { background: 'transparent', border: '1px dashed #2D2848' };
            } else {
              barStyle = { background: '#352F50' };
            }

            return (
              <div key={m} className="flex-1 flex flex-col justify-end h-full">
                <div
                  className="w-full rounded-t-sm transition-all duration-500"
                  style={{
                    ...barStyle,
                    height: isEmpty || isFuture ? '6px' : `${Math.max(heightPct, 4)}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* X-axis labels */}
        <div className="flex gap-[3px] mt-1">
          {MONTHS_SHORT.map((l, m) => {
            const isCurrent = selectedYear === currentYear && m === currentMonth;
            return (
              <div key={m} className="flex-1 text-center">
                <span className={`text-[9px] font-medium ${isCurrent ? 'text-purple-light' : 'text-muted'}`}>
                  {l}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HistoriquePage() {
  const { profile, entries } = useStore();
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();
  const frequency    = profile?.declarationFrequency ?? 'monthly';

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showPrevious, setShowPrevious] = useState(false);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set(entries.map(e => new Date(e.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [entries, currentYear]);

  // Annual stats (current year only)
  const yearStats = useMemo(() => {
    const yStart = new Date(currentYear, 0, 1);
    const yEnd   = new Date(currentYear, 11, 31);
    const yEntries = filterEntriesByPeriod(entries, yStart, yEnd);
    const yearCA = yEntries.reduce((s, e) => s + e.grossAmount, 0);

    // Declarations made = months whose deadline has passed
    let declaredCount = 0;
    for (let m = 0; m < 12; m++) {
      const dl = getMonthDeadline(currentYear, m, frequency);
      if (dl < now) declaredCount++;
    }
    const monthlyAvg = declaredCount > 0 ? yearCA / declaredCount : yearCA;
    return { yearCA, declaredCount, monthlyAvg };
  }, [entries, currentYear, frequency, now.getMonth()]);

  // Monthly CA for selected year (for bar chart + rows)
  const monthlyCA = useMemo(() =>
    Array.from({ length: 12 }, (_, m) => {
      const s = new Date(selectedYear, m, 1);
      const e = new Date(selectedYear, m + 1, 0);
      return filterEntriesByPeriod(entries, s, e).reduce((sum, en) => sum + en.grossAmount, 0);
    }),
    [entries, selectedYear]
  );

  // Build row data for each month
  const monthRows = useMemo(() =>
    MONTHS_FR.map((name, m) => {
      const ca       = monthlyCA[m];
      const deadline = getMonthDeadline(selectedYear, m, frequency);
      const isDeclared = deadline.getTime() < now.getTime();
      const isFuture   = selectedYear === currentYear
        ? m > currentMonth
        : selectedYear > currentYear;
      return { name, m, ca, deadline, isDeclared, isFuture };
    }),
    [monthlyCA, selectedYear, frequency, currentYear, currentMonth, now.getTime()]
  );

  const currentRow  = monthRows[currentMonth];
  const previousRows = monthRows.filter(r => r.isDeclared);
  const futureRows   = monthRows.filter(r => r.isFuture && r.ca > 0);

  if (!profile) return null;

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-4">

        <h1 className="text-2xl font-bold text-text">Historique</h1>

        {/* Annual summary card */}
        <div className="bg-surface border border-border rounded-2xl p-5">
          <p className="text-muted text-xs uppercase tracking-widest mb-4">
            CA annuel {currentYear}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-text text-base font-bold tabular-nums leading-tight">
                {formatEur(yearStats.yearCA)}
              </p>
              <p className="text-muted text-[10px] mt-0.5">CA total</p>
            </div>
            <div className="border-x border-border">
              <p className="text-text text-base font-bold tabular-nums leading-tight">
                {yearStats.declaredCount}
              </p>
              <p className="text-muted text-[10px] mt-0.5">
                Déclaration{yearStats.declaredCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <p className="text-text text-base font-bold tabular-nums leading-tight">
                {formatEur(yearStats.monthlyAvg)}
              </p>
              <p className="text-muted text-[10px] mt-0.5">Moy. / mois</p>
            </div>
          </div>
        </div>

        {/* Year filter */}
        <div className="flex gap-2">
          {availableYears.map(y => (
            <button key={y} onClick={() => setSelectedYear(y)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all
                ${selectedYear === y ? 'text-white' : 'bg-surface border border-border text-muted'}`}
              style={selectedYear === y ? {
                background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                boxShadow: '0 2px 12px rgba(139,92,246,0.35)',
              } : {}}
            >
              {y}
            </button>
          ))}
        </div>

        {/* Bar chart */}
        <div className="bg-surface border border-border rounded-2xl px-4 pt-4 pb-3">
          <MonthlyBarChart
            monthlyCA={monthlyCA}
            currentMonth={currentMonth}
            selectedYear={selectedYear}
            currentYear={currentYear}
          />
        </div>

        {/* Current month card — prominent */}
        {selectedYear === currentYear && (
          <div className="bg-surface rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(139,92,246,0.4)' }}>
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-text text-lg font-bold">{MONTHS_FR[currentMonth]} {currentYear}</p>
                  <p className="text-muted text-xs mt-0.5">
                    À déclarer avant le{' '}
                    <span className="text-text font-medium">
                      {currentRow.deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-text text-2xl font-bold tabular-nums">
                    {formatEur(currentRow.ca)}
                  </p>
                  <div className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 mt-1"
                    style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)' }}>
                    <span className="text-purple-light text-[10px] font-bold">À déclarer</span>
                  </div>
                </div>
              </div>
            </div>
            <a href="https://www.autoentrepreneur.urssaf.fr"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 font-bold text-sm text-white border-t"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
                borderColor: 'rgba(139,92,246,0.4)',
              }}
            >
              Déclarer sur l&apos;URSSAF
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Future months with data */}
        {futureRows.map(row => (
          <MonthRow key={row.m} row={row} />
        ))}

        {/* Previous declarations accordion */}
        {previousRows.length > 0 && (
          <>
            <button
              onClick={() => setShowPrevious(v => !v)}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between"
            >
              <span className="text-text font-medium text-sm">
                Déclarations précédentes
                <span className="text-muted font-normal ml-1.5">({previousRows.length})</span>
              </span>
              {showPrevious
                ? <ChevronUp size={17} className="text-muted" />
                : <ChevronDown size={17} className="text-muted" />}
            </button>

            {showPrevious && (
              <div className="flex flex-col gap-2">
                {[...previousRows].reverse().map(row => (
                  <MonthRow key={row.m} row={row} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </AppShell>
  );
}

// ─── Month row component ───────────────────────────────────────────────────────

function MonthRow({ row }: {
  row: { name: string; m: number; ca: number; deadline: Date; isDeclared: boolean; isFuture: boolean };
}) {
  const deadlineLabel = row.deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-text text-sm font-semibold">{row.name}</p>
        <p className="text-muted text-xs mt-0.5">
          {row.isDeclared
            ? `Déclaré avant le ${deadlineLabel}`
            : `À déclarer avant le ${deadlineLabel}`}
        </p>
      </div>
      <p className={`text-sm font-bold tabular-nums shrink-0 ${row.ca === 0 ? 'text-muted' : 'text-text'}`}>
        {formatEur(row.ca)}
      </p>
      {row.isDeclared ? (
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
}
