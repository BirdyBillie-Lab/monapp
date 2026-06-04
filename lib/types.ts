export type ActivityType = 'services' | 'sales' | 'mixed';
export type DeclarationFrequency = 'monthly' | 'quarterly';
export type PaymentMethod = 'virement' | 'cheque' | 'especes' | 'stripe' | 'paypal' | 'sumup' | 'etsy' | 'autre';
export type IncomeCategory = 'prestation' | 'consulting' | 'formation' | 'vente_produit' | 'marketplace' | 'autre';

// Per-line URSSAF category (simplified for charge calculation)
export type LineCategory = 'services' | 'sales';

export interface InvoiceLine {
  id: string;
  description: string;
  category: LineCategory;
  amount: number;
}

export interface UserProfile {
  activityType: ActivityType;
  declarationFrequency: DeclarationFrequency;
  hasACRE: boolean;
  acreStartDate?: string;
  hasVersementLiberatoire: boolean;
  onboardingComplete: boolean;
  name?: string;
  monthlyObjective?: number;
}

export interface IncomeEntry {
  id: string;
  date: string;
  // New multi-line structure
  lines?: InvoiceLine[];
  // Legacy fields (kept for backward compat — older entries without lines)
  description?: string;
  category?: IncomeCategory;
  // Computed totals
  grossAmount: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  platformFeeRate: number;
  platformFeeAmount: number;
  createdAt: string;
}

export interface AppState {
  profile: UserProfile | null;
  entries: IncomeEntry[];
}

export interface PeriodSummary {
  totalGross: number;
  totalNet: number;
  totalFees: number;
  // Per-category CA
  servicesCA: number;
  salesCA: number;
  // Per-category charges
  servicesSocialCharges: number;
  salesSocialCharges: number;
  servicesVL: number;
  salesVL: number;
  // Totals
  socialCharges: number;
  incomeTax: number;
  totalToSetAside: number;
  netAfterCharges: number;
  thresholdUsedPercent: number;
  threshold: number;
}

export const PLATFORM_FEES: Record<string, { label: string; rate: number }> = {
  virement: { label: 'Virement bancaire', rate: 0 },
  cheque: { label: 'Chèque', rate: 0 },
  especes: { label: 'Espèces', rate: 0 },
  stripe: { label: 'Stripe', rate: 0.015 },
  paypal: { label: 'PayPal', rate: 0.03 },
  sumup: { label: 'SumUp', rate: 0.0175 },
  etsy: { label: 'Etsy', rate: 0.12 },
  autre: { label: 'Autre', rate: 0 },
};

export const INCOME_CATEGORIES: Record<IncomeCategory, string> = {
  prestation: 'Prestation de service',
  consulting: 'Conseil / Consulting',
  formation: 'Formation',
  vente_produit: 'Vente de produit',
  marketplace: 'Vente marketplace',
  autre: 'Autre',
};

// Map legacy categories to line category for charge calculation
export const LEGACY_CATEGORY_TO_LINE: Record<IncomeCategory, LineCategory> = {
  prestation:    'services',
  consulting:    'services',
  formation:     'services',
  vente_produit: 'sales',
  marketplace:   'sales',
  autre:         'services',
};
