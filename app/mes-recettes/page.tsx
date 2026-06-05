'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { filterEntriesByPeriod, formatEur, getEntryLines } from '@/lib/calculations';
import { IncomeEntry, PLATFORM_FEES } from '@/lib/types';
import { Check, ChevronDown, ChevronUp, ExternalLink, FileDown, X } from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];
const MONTHS_SHORT = ['J','F','M','A','M','J','J','A','S','O','N','D'];

// ─── Deadline logic ────────────────────────────────────────────────────────────

function getMonthDeadline(
  year: number,
  month: number,
  frequency: 'monthly' | 'quarterly'
): Date {
  if (frequency === 'monthly') {
    return new Date(year, month + 2, 0);
  }
  const quarter = Math.floor(month / 3);
  const deadlineMonth = (quarter + 1) * 3;
  if (deadlineMonth === 12) return new Date(year + 1, 1, 0);
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
  const yLabels = [max, max / 2, 0].map(v =>
    v === 0 ? '0' : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v))
  );

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between pb-5 text-right w-8 shrink-0">
        {yLabels.map((l, i) => (
          <span key={i} className="text-muted text-[9px] tabular-nums leading-none">{l}</span>
        ))}
      </div>
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

// ─── Month row (Déclarations tab) ──────────────────────────────────────────────

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

// ─── PDF export ────────────────────────────────────────────────────────────────

const PDF_CSS = `
  body{font-family:Arial,sans-serif;font-size:11px;margin:15mm;color:#111}
  h1{font-size:17px;margin:0 0 2px}
  .subtitle{font-size:11px;color:#666;margin:0 0 16px}
  table{width:100%;border-collapse:collapse;font-size:10.5px}
  th{background:#ededf0;text-align:left;padding:6px 8px;border:1px solid #c8c8d0;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:5px 8px;border:1px solid #ddd;vertical-align:top}
  .total-row td{font-weight:700;border-top:2px solid #222;background:#f5f5f5}
  @media print{body{margin:10mm}@page{margin:10mm}}
`;

function buildEntryRows(sorted: IncomeEntry[]): string {
  const fmtEur = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
  return sorted.map((entry, i) => {
    const allLines = getEntryLines(entry);
    const hasServices = allLines.some(l => l.category === 'services');
    const hasSales    = allLines.some(l => l.category === 'sales');
    const nature = hasServices && hasSales
      ? 'Prestation de service / Vente de marchandise'
      : hasServices ? 'Prestation de service' : 'Vente de marchandise';
    const bg = i % 2 === 1 ? 'background:#f9f9f9' : '';
    return `<tr style="${bg}">
      <td>${new Date(entry.date).toLocaleDateString('fr-FR')}</td>
      <td>${entry.clientName ?? '—'}</td>
      <td>${entry.invoiceRef ?? '—'}</td>
      <td>${nature}</td>
      <td style="text-align:right;white-space:nowrap">${fmtEur(entry.grossAmount)}</td>
      <td>${PLATFORM_FEES[entry.paymentMethod]?.label ?? entry.paymentMethod}</td>
    </tr>`;
  }).join('');
}

function openPrintWindow(html: string) {
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  }
}

function printByMonth(allEntries: IncomeEntry[], month: number, year: number) {
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0);
  const sorted = filterEntriesByPeriod(allEntries, start, end).sort((a, b) => a.date.localeCompare(b.date));
  const total  = sorted.reduce((s, e) => s + e.grossAmount, 0);
  const label  = `${MONTHS_FR[month]} ${year}`;
  const fmtEur = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
  openPrintWindow(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Livre des recettes — ${label}</title><style>${PDF_CSS}</style></head>
<body><h1>Livre des recettes</h1><p class="subtitle">${label}</p>
<table><thead><tr>
  <th>Date</th><th>Identité du client</th><th>Réf. facture</th>
  <th>Nature de l'opération</th><th style="text-align:right">Montant TTC (€)</th><th>Mode de règlement</th>
</tr></thead><tbody>
${buildEntryRows(sorted)}
<tr class="total-row"><td colspan="4">Total ${label}</td>
<td style="text-align:right;white-space:nowrap">${fmtEur(total)}</td><td></td></tr>
</tbody></table></body></html>`);
}

function printByQuarter(allEntries: IncomeEntry[], quarter: number, year: number) {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end   = new Date(year, startMonth + 3, 0);
  const sorted = filterEntriesByPeriod(allEntries, start, end).sort((a, b) => a.date.localeCompare(b.date));
  const total  = sorted.reduce((s, e) => s + e.grossAmount, 0);
  const label  = `T${quarter} ${year}`;
  const fmtEur = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);
  openPrintWindow(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Livre des recettes — ${label}</title><style>${PDF_CSS}</style></head>
<body><h1>Livre des recettes</h1><p class="subtitle">${label}</p>
<table><thead><tr>
  <th>Date</th><th>Identité du client</th><th>Réf. facture</th>
  <th>Nature de l'opération</th><th style="text-align:right">Montant TTC (€)</th><th>Mode de règlement</th>
</tr></thead><tbody>
${buildEntryRows(sorted)}
<tr class="total-row"><td colspan="4">Total ${label}</td>
<td style="text-align:right;white-space:nowrap">${fmtEur(total)}</td><td></td></tr>
</tbody></table></body></html>`);
}

// ─── Export modal ──────────────────────────────────────────────────────────────

function ExportModal({ entries, onClose }: { entries: IncomeEntry[]; onClose: () => void }) {
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQ     = Math.floor(currentMonth / 3) + 1;

  const [type,    setType]    = useState<'month' | 'quarter'>('month');
  const [year,    setYear]    = useState(currentYear);
  const [month,   setMonth]   = useState(currentMonth);
  const [quarter, setQuarter] = useState(currentQ);

  const availableYears = useMemo(() => {
    const years = new Set(entries.map(e => new Date(e.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [entries, currentYear]);

  const handleGenerate = () => {
    if (type === 'month') printByMonth(entries, month, year);
    else printByQuarter(entries, quarter, year);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-surface rounded-t-3xl p-5 flex flex-col gap-5 safe-bottom">
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto -mt-1" />

        <div className="flex items-center justify-between">
          <p className="text-text font-bold text-base">Exporter le livre des recettes</p>
          <button onClick={onClose} className="text-muted">
            <X size={20} />
          </button>
        </div>

        {/* Period type */}
        <div>
          <p className="text-muted text-xs uppercase tracking-widest mb-2">Période</p>
          <div className="flex gap-2">
            {(['month', 'quarter'] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={type === t
                  ? { background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', color: '#fff' }
                  : { background: '#1E1A2E', border: '1px solid #2D2848', color: '#9B8EC4' }}
              >
                {t === 'month' ? 'Mois' : 'Trimestre'}
              </button>
            ))}
          </div>
        </div>

        {/* Year */}
        <div>
          <p className="text-muted text-xs uppercase tracking-widest mb-2">Année</p>
          <div className="flex gap-2 flex-wrap">
            {availableYears.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={year === y
                  ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
                  : { background: '#1E1A2E', border: '1px solid #2D2848', color: '#9B8EC4' }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Month or Quarter selector */}
        {type === 'month' ? (
          <div>
            <p className="text-muted text-xs uppercase tracking-widest mb-2">Mois</p>
            <div className="grid grid-cols-4 gap-1.5">
              {MONTHS_FR.map((name, m) => {
                const isFuture = year === currentYear && m > currentMonth;
                return (
                  <button key={m} onClick={() => !isFuture && setMonth(m)}
                    disabled={isFuture}
                    className="py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-30"
                    style={month === m && !isFuture
                      ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
                      : { background: '#1E1A2E', border: '1px solid #2D2848', color: '#9B8EC4' }}
                  >
                    {name.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <p className="text-muted text-xs uppercase tracking-widest mb-2">Trimestre</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(q => {
                const isFuture = year === currentYear && q > currentQ;
                return (
                  <button key={q} onClick={() => !isFuture && setQuarter(q)}
                    disabled={isFuture}
                    className="py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
                    style={quarter === q && !isFuture
                      ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
                      : { background: '#1E1A2E', border: '1px solid #2D2848', color: '#9B8EC4' }}
                  >
                    T{q}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button onClick={handleGenerate}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
          }}
        >
          <FileDown size={16} strokeWidth={2.5} />
          Générer le PDF
        </button>
      </div>
    </div>
  );
}

// ─── Journal tab ───────────────────────────────────────────────────────────────

function JournalTab({ entries }: { entries: IncomeEntry[] }) {
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selectedYear,   setSelectedYear]   = useState(currentYear);
  const [selectedMonth,  setSelectedMonth]  = useState(currentMonth);
  const [showExport,     setShowExport]     = useState(false);

  // Available years
  const availableYears = useMemo(() => {
    const years = new Set(entries.map(e => new Date(e.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [entries, currentYear]);

  // Entries for selected month
  const monthEntries = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end   = new Date(selectedYear, selectedMonth + 1, 0);
    return filterEntriesByPeriod(entries, start, end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, selectedYear, selectedMonth]);

  const total = monthEntries.reduce((s, e) => s + e.grossAmount, 0);

  return (
    <div className="flex flex-col gap-4">

      {/* Month/Year filter */}
      <div className="flex flex-col gap-3">
        {/* Year pills */}
        <div className="flex gap-2 flex-wrap">
          {availableYears.map(y => (
            <button key={y} onClick={() => {
              setSelectedYear(y);
              if (y === currentYear) setSelectedMonth(currentMonth);
              else setSelectedMonth(11);
            }}
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

        {/* Month selector */}
        <div className="flex gap-1.5 flex-wrap">
          {MONTHS_FR.map((name, m) => {
            const isFuture = selectedYear === currentYear && m > currentMonth;
            if (isFuture) return null;
            const isSelected = m === selectedMonth;
            return (
              <button key={m} onClick={() => setSelectedMonth(m)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={isSelected
                  ? { background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
                  : { background: '#1E1A2E', border: '1px solid #2D2848', color: '#9B8EC4' }}
              >
                {name.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entry list */}
      {monthEntries.length === 0 ? (
        <div className="bg-surface border border-dashed border-border rounded-2xl px-5 py-8 text-center">
          <p className="text-muted text-sm">Aucun encaissement pour {MONTHS_FR[selectedMonth].toLowerCase()} {selectedYear}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {monthEntries.map(entry => (
            <JournalEntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Summary + export */}
      <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
        {monthEntries.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted text-xs uppercase tracking-widest">
                Total {MONTHS_FR[selectedMonth]} {selectedYear}
              </span>
              <span className="text-text font-bold text-lg tabular-nums">{formatEur(total)}</span>
            </div>
            <div className="h-px bg-border" />
          </>
        )}
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)',
            boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
          }}
        >
          <FileDown size={16} strokeWidth={2.5} />
          Exporter le livre des recettes — PDF
        </button>
      </div>

      {showExport && (
        <ExportModal entries={entries} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

function JournalEntryRow({ entry }: { entry: IncomeEntry }) {
  const allLines    = getEntryLines(entry);
  const hasServices = allLines.some(l => l.category === 'services');
  const hasSales    = allLines.some(l => l.category === 'sales');
  const nature = hasServices && hasSales
    ? 'Prestation / Vente'
    : hasServices
      ? 'Prestation'
      : 'Vente';
  const dateFmt      = new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  const paymentLabel = PLATFORM_FEES[entry.paymentMethod]?.label ?? entry.paymentMethod;

  return (
    <div className="bg-surface border border-border rounded-2xl px-4 py-3.5 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted text-xs tabular-nums">{dateFmt}</span>
            <span className="text-text text-sm font-semibold truncate">
              {entry.clientName ?? <span className="text-muted font-normal italic">Client non renseigné</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {entry.invoiceRef && (
              <span className="text-muted text-[10px]">{entry.invoiceRef}</span>
            )}
            <span className="text-muted text-[10px]">·</span>
            <span className="text-muted text-[10px]">{nature}</span>
            <span className="text-muted text-[10px]">·</span>
            <span className="text-muted text-[10px]">{paymentLabel}</span>
          </div>
        </div>
        <span className="text-text font-bold tabular-nums text-sm shrink-0">{formatEur(entry.grossAmount)}</span>
      </div>
    </div>
  );
}

// ─── Déclarations tab ──────────────────────────────────────────────────────────

function DeclarationsTab({ entries }: { entries: IncomeEntry[] }) {
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();
  const { profile }  = useStore();
  const frequency    = profile?.declarationFrequency ?? 'monthly';

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showPrevious, setShowPrevious] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set(entries.map(e => new Date(e.date).getFullYear()));
    years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [entries, currentYear]);

  const yearStats = useMemo(() => {
    const yStart   = new Date(currentYear, 0, 1);
    const yEnd     = new Date(currentYear, 11, 31);
    const yEntries = filterEntriesByPeriod(entries, yStart, yEnd);
    const yearCA   = yEntries.reduce((s, e) => s + e.grossAmount, 0);

    let declaredCount = 0;
    for (let m = 0; m < 12; m++) {
      const dl = getMonthDeadline(currentYear, m, frequency);
      if (dl < now) declaredCount++;
    }
    const monthlyAvg = declaredCount > 0 ? yearCA / declaredCount : yearCA;
    return { yearCA, declaredCount, monthlyAvg };
  }, [entries, currentYear, frequency]);

  const monthlyCA = useMemo(() =>
    Array.from({ length: 12 }, (_, m) => {
      const s = new Date(selectedYear, m, 1);
      const e = new Date(selectedYear, m + 1, 0);
      return filterEntriesByPeriod(entries, s, e).reduce((sum, en) => sum + en.grossAmount, 0);
    }),
    [entries, selectedYear]
  );

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
    [monthlyCA, selectedYear, frequency, currentYear, currentMonth]
  );

  const currentRow   = monthRows[currentMonth];
  const previousRows = monthRows.filter(r => r.isDeclared);
  const futureRows   = monthRows.filter(r => r.isFuture && r.ca > 0);

  return (
    <div className="flex flex-col gap-4">

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

      {/* Current month card */}
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

      {futureRows.map(row => (
        <MonthRow key={row.m} row={row} />
      ))}

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
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function MesRecettesPage() {
  const { profile, entries } = useStore();
  const [activeTab, setActiveTab] = useState<'declarations' | 'journal'>('declarations');

  if (!profile) return null;

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-4">

        <h1 className="text-2xl font-bold text-text">Mes recettes</h1>

        {/* Sub-tabs */}
        <div className="flex gap-1 bg-surface border border-border rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('declarations')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={activeTab === 'declarations'
              ? { background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', color: '#fff', boxShadow: '0 2px 10px rgba(139,92,246,0.3)' }
              : { color: '#9B8EC4' }}
          >
            Déclarations
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={activeTab === 'journal'
              ? { background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', color: '#fff', boxShadow: '0 2px 10px rgba(139,92,246,0.3)' }
              : { color: '#9B8EC4' }}
          >
            Journal
          </button>
        </div>

        {activeTab === 'declarations'
          ? <DeclarationsTab entries={entries} />
          : <JournalTab entries={entries} />
        }

      </div>
    </AppShell>
  );
}
