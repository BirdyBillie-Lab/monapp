import {
  ActivityType, IncomeEntry, InvoiceLine, LineCategory,
  LEGACY_CATEGORY_TO_LINE, PeriodSummary, UserProfile,
} from './types';

// ─── Rates ────────────────────────────────────────────────────────────────────

// Per-line URSSAF social charge rates
const LINE_SOCIAL_RATES: Record<LineCategory, number> = {
  services: 0.22,   // Prestations de services
  sales:    0.123,  // Vente de marchandises
};
const LINE_VL_RATES: Record<LineCategory, number> = {
  services: 0.022,
  sales:    0.01,
};

// Legacy single-rate fallback (activity-type based)
const SOCIAL_RATES: Record<ActivityType, number> = {
  services: 0.22,
  sales:    0.123,
  mixed:    0.177,
};
const VL_RATES: Record<ActivityType, number> = {
  services: 0.022,
  sales:    0.01,
  mixed:    0.016,
};

export const THRESHOLDS: Record<ActivityType, number> = {
  services: 77700,
  sales:    188700,
  mixed:    77700,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isACREActive(profile: UserProfile): boolean {
  if (!profile.hasACRE || !profile.acreStartDate) return profile.hasACRE;
  const acreEnd = new Date(profile.acreStartDate);
  acreEnd.setFullYear(acreEnd.getFullYear() + 1);
  return new Date() <= acreEnd;
}

/** Converts any entry (legacy or new) to a flat list of InvoiceLines. */
export function getEntryLines(entry: IncomeEntry): InvoiceLine[] {
  if (entry.lines && entry.lines.length > 0) return entry.lines;
  // Legacy entry: synthesise one line
  const cat: LineCategory = entry.category
    ? LEGACY_CATEGORY_TO_LINE[entry.category]
    : 'services';
  return [{
    id: 'legacy',
    description: entry.description ?? 'Encaissement',
    category: cat,
    amount: entry.grossAmount,
  }];
}

// ─── Charge calculations ───────────────────────────────────────────────────────

/** Per-category charge breakdown from a set of lines. */
export function calculateLineCharges(
  lines: InvoiceLine[],
  hasACRE: boolean,
  hasVL: boolean
): {
  servicesCA: number;
  salesCA: number;
  servicesSocialCharges: number;
  salesSocialCharges: number;
  servicesVL: number;
  salesVL: number;
  totalSocialCharges: number;
  totalVL: number;
  total: number;
} {
  const acreMultiplier = hasACRE ? 0.5 : 1;

  const servicesCA = lines.filter(l => l.category === 'services').reduce((s, l) => s + l.amount, 0);
  const salesCA    = lines.filter(l => l.category === 'sales').reduce((s, l) => s + l.amount, 0);

  const servicesSocialCharges = servicesCA * LINE_SOCIAL_RATES.services * acreMultiplier;
  const salesSocialCharges    = salesCA    * LINE_SOCIAL_RATES.sales    * acreMultiplier;
  const servicesVL            = hasVL ? servicesCA * LINE_VL_RATES.services : 0;
  const salesVL               = hasVL ? salesCA    * LINE_VL_RATES.sales    : 0;

  const totalSocialCharges = servicesSocialCharges + salesSocialCharges;
  const totalVL = servicesVL + salesVL;

  return {
    servicesCA,
    salesCA,
    servicesSocialCharges,
    salesSocialCharges,
    servicesVL,
    salesVL,
    totalSocialCharges,
    totalVL,
    total: totalSocialCharges + totalVL,
  };
}

/** Legacy single-amount fallback (still used in historique period rows). */
export function calculateCharges(
  grossAmount: number,
  profile: UserProfile
): { socialCharges: number; incomeTax: number; total: number } {
  const acreActive = isACREActive(profile);
  const socialRate = SOCIAL_RATES[profile.activityType] * (acreActive ? 0.5 : 1);
  const vlRate = profile.hasVersementLiberatoire ? VL_RATES[profile.activityType] : 0;
  const socialCharges = grossAmount * socialRate;
  const incomeTax = grossAmount * vlRate;
  return { socialCharges, incomeTax, total: socialCharges + incomeTax };
}

// ─── Period summary ────────────────────────────────────────────────────────────

export function calculatePeriodSummary(
  entries: IncomeEntry[],
  profile: UserProfile,
  allYearEntries?: IncomeEntry[]
): PeriodSummary {
  const totalGross = entries.reduce((s, e) => s + e.grossAmount, 0);
  const totalNet   = entries.reduce((s, e) => s + e.netAmount,   0);
  const totalFees  = entries.reduce((s, e) => s + e.platformFeeAmount, 0);

  // Flatten all lines across entries for per-category charges
  const allLines = entries.flatMap(getEntryLines);
  const acreActive = isACREActive(profile);
  const charges = calculateLineCharges(allLines, acreActive, profile.hasVersementLiberatoire);

  const totalToSetAside = charges.total;
  const netAfterCharges = totalGross - totalToSetAside;

  const yearEntries = allYearEntries ?? entries;
  const yearGross   = yearEntries.reduce((s, e) => s + e.grossAmount, 0);
  const threshold   = THRESHOLDS[profile.activityType];
  const thresholdUsedPercent = Math.min((yearGross / threshold) * 100, 100);

  return {
    totalGross,
    totalNet,
    totalFees,
    servicesCA: charges.servicesCA,
    salesCA: charges.salesCA,
    servicesSocialCharges: charges.servicesSocialCharges,
    salesSocialCharges: charges.salesSocialCharges,
    servicesVL: charges.servicesVL,
    salesVL: charges.salesVL,
    socialCharges: charges.totalSocialCharges,
    incomeTax: charges.totalVL,
    totalToSetAside,
    netAfterCharges,
    thresholdUsedPercent,
    threshold,
  };
}

// ─── ACRE status ──────────────────────────────────────────────────────────────

export type AcreAlertLevel = 'none' | 'warning_3months' | 'warning_1month' | 'expired';

export interface ACREStatus {
  hasACRE: boolean;
  isActive: boolean;
  isExpired: boolean;
  startDate: Date | null;
  endDate: Date | null;
  daysRemaining: number;
  monthsRemaining: number;
  alertLevel: AcreAlertLevel;
}

export function getACREStatus(profile: UserProfile): ACREStatus {
  if (!profile.hasACRE) {
    return { hasACRE: false, isActive: false, isExpired: false, startDate: null, endDate: null, daysRemaining: 0, monthsRemaining: 0, alertLevel: 'none' };
  }
  const startDate = profile.acreStartDate ? new Date(profile.acreStartDate) : new Date();
  const endDate   = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const now = new Date();
  const daysRemaining   = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.ceil(daysRemaining / 30);
  const isActive  = daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  let alertLevel: AcreAlertLevel = 'none';
  if (isExpired)           alertLevel = 'expired';
  else if (daysRemaining <= 31)  alertLevel = 'warning_1month';
  else if (daysRemaining <= 92)  alertLevel = 'warning_3months';

  return { hasACRE: true, isActive, isExpired, startDate, endDate, daysRemaining, monthsRemaining, alertLevel };
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function getHealthStatus(pct: number): 'green' | 'orange' | 'red' {
  return pct < 70 ? 'green' : pct < 90 ? 'orange' : 'red';
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEurDecimal(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrentQuarter(date: Date = new Date()): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getQuarterDateRange(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  return { start: new Date(year, startMonth, 1), end: new Date(year, startMonth + 3, 0) };
}

export function filterEntriesByPeriod(entries: IncomeEntry[], start: Date, end: Date): IncomeEntry[] {
  return entries.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });
}

export function getDeclarationPeriodLabel(frequency: 'monthly' | 'quarterly', date: Date = new Date()): string {
  if (frequency === 'monthly') return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return `T${getCurrentQuarter(date)} ${date.getFullYear()}`;
}

export function getNextDeclarationDeadline(frequency: 'monthly' | 'quarterly', now: Date = new Date()): Date {
  if (frequency === 'monthly') return new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const q = getCurrentQuarter(now);
  const deadlineMonth = q * 3;
  if (deadlineMonth === 12) return new Date(now.getFullYear() + 1, 0, 31);
  return new Date(now.getFullYear(), deadlineMonth + 1, 0);
}
