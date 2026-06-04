import { ActivityType, IncomeEntry, PeriodSummary, UserProfile } from './types';

// Social charges rates 2024
const SOCIAL_RATES: Record<ActivityType, number> = {
  services: 0.231,  // BNC professions libérales
  sales: 0.123,     // Commerce / vente de marchandises
  mixed: 0.177,     // Moyenne pondérée approximative
};

// Versement libératoire rates
const VL_RATES: Record<ActivityType, number> = {
  services: 0.022,
  sales: 0.01,
  mixed: 0.016,
};

// Revenue thresholds 2024
export const THRESHOLDS: Record<ActivityType, number> = {
  services: 77700,
  sales: 188700,
  mixed: 77700,
};

// ACRE: halved rates for first full year
function isACREActive(profile: UserProfile): boolean {
  if (!profile.hasACRE || !profile.acreStartDate) return profile.hasACRE;
  const start = new Date(profile.acreStartDate);
  const acreEnd = new Date(start);
  acreEnd.setFullYear(acreEnd.getFullYear() + 1);
  return new Date() <= acreEnd;
}

export function calculateCharges(
  grossAmount: number,
  profile: UserProfile
): { socialCharges: number; incomeTax: number; total: number } {
  const acreActive = isACREActive(profile);
  const socialRate = SOCIAL_RATES[profile.activityType] * (acreActive ? 0.5 : 1);
  const vlRate = profile.hasVersementLiberatoire ? VL_RATES[profile.activityType] : 0;

  const socialCharges = grossAmount * socialRate;
  const incomeTax = grossAmount * vlRate;

  return {
    socialCharges,
    incomeTax,
    total: socialCharges + incomeTax,
  };
}

export function calculatePeriodSummary(
  entries: IncomeEntry[],
  profile: UserProfile,
  allYearEntries?: IncomeEntry[]
): PeriodSummary {
  const totalGross = entries.reduce((sum, e) => sum + e.grossAmount, 0);
  const totalNet = entries.reduce((sum, e) => sum + e.netAmount, 0);
  const totalFees = entries.reduce((sum, e) => sum + e.platformFeeAmount, 0);

  const { socialCharges, incomeTax } = calculateCharges(totalGross, profile);
  const totalToSetAside = socialCharges + incomeTax;
  const netAfterCharges = totalGross - totalToSetAside;

  const yearEntries = allYearEntries ?? entries;
  const yearGross = yearEntries.reduce((sum, e) => sum + e.grossAmount, 0);
  const threshold = THRESHOLDS[profile.activityType];
  const thresholdUsedPercent = Math.min((yearGross / threshold) * 100, 100);

  return {
    totalGross,
    totalNet,
    totalFees,
    socialCharges,
    incomeTax,
    totalToSetAside,
    netAfterCharges,
    thresholdUsedPercent,
    threshold,
  };
}

export function getHealthStatus(thresholdPercent: number): 'green' | 'orange' | 'red' {
  if (thresholdPercent < 70) return 'green';
  if (thresholdPercent < 90) return 'orange';
  return 'red';
}

export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatEurDecimal(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getCurrentQuarter(date: Date = new Date()): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getQuarterDateRange(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, startMonth + 3, 0),
  };
}

export function filterEntriesByPeriod(
  entries: IncomeEntry[],
  start: Date,
  end: Date
): IncomeEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.date);
    return d >= start && d <= end;
  });
}

export function getDeclarationPeriodLabel(frequency: 'monthly' | 'quarterly', date: Date = new Date()): string {
  if (frequency === 'monthly') {
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
  const q = getCurrentQuarter(date);
  return `T${q} ${date.getFullYear()}`;
}

export function getNextDeclarationDeadline(frequency: 'monthly' | 'quarterly', now: Date = new Date()): Date {
  if (frequency === 'monthly') {
    // Due end of the month following the declaration period
    return new Date(now.getFullYear(), now.getMonth() + 2, 0);
  }
  // Quarterly: due end of the month after the quarter closes
  const q = getCurrentQuarter(now);
  const deadlineMonth = q * 3; // Apr=3, Jul=6, Oct=9, Jan=12 (next year)
  if (deadlineMonth === 12) {
    return new Date(now.getFullYear() + 1, 0, 31);
  }
  return new Date(now.getFullYear(), deadlineMonth + 1, 0);
}
