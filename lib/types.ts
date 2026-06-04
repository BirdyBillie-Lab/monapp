export type ActivityType = 'services' | 'sales' | 'mixed';
export type DeclarationFrequency = 'monthly' | 'quarterly';
export type PaymentMethod = 'virement' | 'cheque' | 'especes' | 'stripe' | 'paypal' | 'sumup' | 'etsy' | 'autre';
export type IncomeCategory = 'prestation' | 'consulting' | 'formation' | 'vente_produit' | 'marketplace' | 'autre';

export interface UserProfile {
  activityType: ActivityType;
  declarationFrequency: DeclarationFrequency;
  hasACRE: boolean;
  acreStartDate?: string;
  hasVersementLiberatoire: boolean;
  onboardingComplete: boolean;
  name?: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  description: string;
  grossAmount: number;
  netAmount: number;
  category: IncomeCategory;
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
