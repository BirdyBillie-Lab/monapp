'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import DonutChart from '@/components/DonutChart';
import {
  filterEntriesByPeriod,
  formatEur,
  getNextDeclarationDeadline,
  getACREStatus,
  getEntryLines,
} from '@/lib/calculations';
import { IncomeEntry, UserProfile } from '@/lib/types';
import { Plus, Bell, BellOff, AlertTriangle, ChevronRight, Pencil, BookOpen, TrendingUp, Target } from 'lucide-react';

// ─── Motivational messages ─────────────────────────────────────────────────────

const MOTIVATIONAL_MESSAGES = [
  "Vous avancez à votre rythme. C'est déjà beaucoup.",
  "Chaque jour travaillé compte. Bravo pour votre régularité.",
  "Votre activité prend forme. Continuez comme ça.",
  "Vous gérez votre activité avec sérieux. C'est pas rien.",
  "Un encaissement de plus, une journée de travail reconnue.",
];

// ─── Notification helpers ──────────────────────────────────────────────────────

function getNotifPermission(): NotificationPermission | 'unsupported' {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

async function requestNotifPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.requestPermission();
}

function fireNotification(title: string, body: string) {
  if (getNotifPermission() !== 'granted') return;
  try { new Notification(title, { body, icon: '/icon-192x192.png' }); } catch { /* ignore */ }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, entries } = useStore();
  const router = useRouter();
  const now = new Date();

  const data = useMemo(() => {
    if (!profile) return null;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEntries = filterEntriesByPeriod(entries, monthStart, monthEnd);
    const monthCA = monthEntries.reduce((s, e) => s + e.grossAmount, 0);

    const allLines   = monthEntries.flatMap(getEntryLines);
    const servicesCA = allLines.filter(l => l.category === 'services').reduce((s, l) => s + l.amount, 0);
    const salesCA    = allLines.filter(l => l.category === 'sales').reduce((s, l) => s + l.amount, 0);
    const servicesPct = monthCA > 0 ? Math.round((servicesCA / monthCA) * 100) : 0;
    const salesPct    = monthCA > 0 ? Math.round((salesCA    / monthCA) * 100) : 0;

    const deadline = getNextDeclarationDeadline(profile.declarationFrequency, now);
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const objective    = profile.monthlyObjective ?? 0;
    const objProgress  = objective > 0 ? Math.min((monthCA / objective) * 100, 100) : 0;
    const objRemaining = Math.max((objective || 0) - monthCA, 0);
    const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeftMonth = daysInMonth - now.getDate();
    const monthName    = now.toLocaleDateString('fr-FR', { month: 'long' });

    // Last 5 entries sorted by date desc
    const recentEntries = [...entries]
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    return {
      monthCA, servicesCA, salesCA, servicesPct, salesPct,
      deadline, daysLeft, objective, objProgress, objRemaining,
      daysLeftMonth, monthName, recentEntries,
    };
  }, [entries, profile, now.getMonth(), now.getFullYear()]);

  const [motivationalIdx, setMotivationalIdx] = useState(0);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    // Motivational message — stable per session
    const stored = sessionStorage.getItem('motivational_index');
    if (stored !== null) {
      setMotivationalIdx(parseInt(stored, 10) % MOTIVATIONAL_MESSAGES.length);
    } else {
      const idx = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
      sessionStorage.setItem('motivational_index', String(idx));
      setMotivationalIdx(idx);
    }
    // Notification permission state
    setNotifPerm(getNotifPermission());
  }, []);

  // Auto-fire notification when deadline is close (once per session per deadline)
  useEffect(() => {
    if (!data || getNotifPermission() !== 'granted') return;
    if (data.daysLeft < 0 || data.daysLeft > 7) return;
    const key = `notif_shown_${data.deadline.toDateString()}`;
    if (sessionStorage.getItem(key)) return;
    const deadlineFmt = data.deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    fireNotification('Copilote — Déclaration à venir', `Plus que ${data.daysLeft} jour${data.daysLeft > 1 ? 's' : ''} pour déclarer avant le ${deadlineFmt}.`);
    sessionStorage.setItem(key, '1');
  }, [data]);

  const handleBell = async () => {
    const perm = getNotifPermission();
    if (perm === 'unsupported') return;
    if (perm === 'granted') {
      fireNotification('Copilote', 'Les notifications sont actives. Vous serez rappelé avant chaque déclaration.');
    } else if (perm !== 'denied') {
      const result = await requestNotifPermission();
      setNotifPerm(result);
      if (result === 'granted') {
        fireNotification('Copilote', 'Notifications activées ! Vous serez rappelé avant chaque déclaration.');
      }
    }
  };

  if (!profile || !data) return null;

  const {
    monthCA, servicesCA, salesCA, servicesPct, salesPct,
    deadline, daysLeft, objective, objProgress, objRemaining,
    daysLeftMonth, monthName, recentEntries,
  } = data;

  const greetingName = profile.name ?? null;
  const deadlineFmt = deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const dlColor     = daysLeft <= 7 ? '#EF4444' : daysLeft <= 14 ? '#F59E0B' : '#22C55E';
  const bellActive  = notifPerm === 'granted';

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-6 flex flex-col gap-4">

        {/* Greeting + bell */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text text-2xl font-bold">
              {greetingName
                ? <>Bonjour, <span style={{ color: '#A78BFA' }}>{greetingName}</span></>
                : 'Bonjour'}
            </p>
            <p className="text-muted text-sm capitalize">{monthName} {now.getFullYear()}</p>
          </div>
          <button onClick={handleBell}
            className="relative w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
            {notifPerm === 'denied'
              ? <BellOff size={18} className="text-muted" />
              : <Bell size={18} className={bellActive ? 'text-purple-light' : 'text-muted'} />}
            {bellActive && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-success border-2 border-bg" />
            )}
          </button>
        </div>

        {/* Declaration reminder */}
        <div className="flex items-center gap-3 rounded-2xl border px-4 py-2.5"
          style={{ background: `${dlColor}10`, borderColor: `${dlColor}40` }}>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dlColor }} />
          <p className="text-text text-xs flex-1">
            Prochaine déclaration :{' '}
            <span className="font-semibold" style={{ color: dlColor }}>{deadlineFmt}</span>
          </p>
          <span className="text-xs font-bold tabular-nums shrink-0" style={{ color: dlColor }}>J-{daysLeft}</span>
        </div>

        {/* ACRE alert */}
        <AcreBanner profile={profile} />

        {/* CTA */}
        <Link href="/income/new"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}>
          <Plus size={18} strokeWidth={2.5} />
          Ajouter un encaissement
        </Link>

        {entries.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <BookOpen size={28} className="text-purple-light" />
            </div>
            <div>
              <p className="text-text font-bold text-base mb-1">Votre journal est vide</p>
              <p className="text-muted text-sm leading-relaxed">
                Enregistrez votre première recette pour faire apparaître vos statistiques ici.
              </p>
            </div>
            <div className="w-full flex flex-col gap-2.5 text-left">
              {[
                { icon: <TrendingUp size={14} />, text: 'Répartition de votre CA par catégorie' },
                { icon: <BookOpen size={14} />, text: 'Historique de vos dernières recettes' },
                { icon: <Target size={14} />, text: 'Suivi de votre objectif mensuel' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)' }}>
                  <span className="text-purple-light shrink-0">{item.icon}</span>
                  <span className="text-muted text-xs">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Donut + legend */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <p className="text-muted text-xs uppercase tracking-widest mb-4">Répartition du mois</p>
              <div className="flex items-center gap-4">
                <DonutChart servicesCA={servicesCA} salesCA={salesCA} centerLabel={formatEur(monthCA)} centerSub="CA du mois" showSegmentPct />
                <div className="flex-1 flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#8B5CF6' }} />
                      <span className="text-muted text-xs leading-tight">Prestations de services</span>
                    </div>
                    <p className="text-text font-bold text-base tabular-nums pl-4">{formatEur(servicesCA)}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md w-fit ml-4"
                      style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA' }}>{servicesPct}%</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: '#F59E0B' }} />
                      <span className="text-muted text-xs leading-tight">Vente de marchandises</span>
                    </div>
                    <p className="text-text font-bold text-base tabular-nums pl-4">{formatEur(salesCA)}</p>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md w-fit ml-4"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>{salesPct}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent entries */}
            {recentEntries.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <p className="text-muted text-xs uppercase tracking-widest">Derniers encaissements</p>
                  <Link href="/mes-recettes" className="text-purple-light text-[11px] font-medium">
                    Voir tout →
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {recentEntries.map(entry => (
                    <RecentEntryRow key={entry.id} entry={entry} onEdit={() => router.push(`/income/edit/${entry.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Monthly objective */}
        {objective > 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-5">
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
            <div className="h-2.5 bg-surface-3 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${objProgress}%`, background: objProgress >= 100 ? '#22C55E' : 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: objProgress >= 100 ? 'rgba(34,197,94,0.15)' : 'rgba(139,92,246,0.15)', color: objProgress >= 100 ? '#22C55E' : '#A78BFA' }}>
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
          <Link href="/settings" className="bg-surface border border-dashed border-border rounded-2xl px-5 py-4 flex items-center justify-between">
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
            {MOTIVATIONAL_MESSAGES[motivationalIdx]}
          </p>
        </div>

      </div>
    </AppShell>
  );
}

// ─── Recent entry row ──────────────────────────────────────────────────────────

function RecentEntryRow({ entry, onEdit }: { entry: IncomeEntry; onEdit: () => void }) {
  const allLines = getEntryLines(entry);
  const label = entry.clientName
    || allLines[0]?.description
    || 'Encaissement';
  const dateFmt = new Date(entry.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
        <span className="text-muted text-[10px] font-bold tabular-nums">{dateFmt}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-text text-sm font-medium truncate">{label}</p>
        {entry.invoiceRef && <p className="text-muted text-[10px]">{entry.invoiceRef}</p>}
      </div>
      <span className="text-text font-bold text-sm tabular-nums shrink-0">{formatEur(entry.grossAmount)}</span>
      <button onClick={onEdit} className="text-muted shrink-0">
        <Pencil size={14} />
      </button>
    </div>
  );
}

// ─── ACRE banner ───────────────────────────────────────────────────────────────

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
            Depuis le {endLabel}, vos cotisations sont revenues à leur taux normal.
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
          <p className="text-warning text-sm font-semibold">L&apos;ACRE se termine dans {status.daysRemaining} jour{status.daysRemaining > 1 ? 's' : ''}</p>
          <p className="text-warning/70 text-xs mt-0.5">À partir du {endLabel}, vos charges sociales augmenteront.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning/6 px-4 py-3">
      <AlertTriangle size={16} className="text-warning/80 mt-0.5 shrink-0" />
      <div>
        <p className="text-text text-sm font-medium">L&apos;ACRE se termine dans <span className="text-warning font-semibold">{status.monthsRemaining} mois</span></p>
        <p className="text-muted text-xs mt-0.5">Fin le {endLabel} — préparez-vous.</p>
      </div>
    </div>
  );
}
