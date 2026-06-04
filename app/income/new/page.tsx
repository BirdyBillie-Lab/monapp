'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import {
  IncomeCategory,
  PaymentMethod,
  PLATFORM_FEES,
  INCOME_CATEGORIES,
  IncomeEntry,
} from '@/lib/types';
import { formatEurDecimal } from '@/lib/calculations';
import { ChevronLeft, Check } from 'lucide-react';

export default function NewIncomePage() {
  const router = useRouter();
  const { addEntry } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('prestation');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('virement');
  const [submitted, setSubmitted] = useState(false);

  const feeInfo = PLATFORM_FEES[paymentMethod];
  const grossAmount = parseFloat(amount) || 0;
  const feeAmount = grossAmount * feeInfo.rate;
  const netAmount = grossAmount - feeAmount;

  const isValid = description.trim().length > 0 && grossAmount > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const entry: IncomeEntry = {
      id: crypto.randomUUID(),
      date,
      description: description.trim(),
      grossAmount,
      netAmount,
      category,
      paymentMethod,
      platformFeeRate: feeInfo.rate,
      platformFeeAmount: feeAmount,
      createdAt: new Date().toISOString(),
    };

    addEntry(entry);
    setSubmitted(true);
    setTimeout(() => router.replace('/dashboard'), 1000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center mb-4">
          <Check size={36} className="text-success" />
        </div>
        <p className="text-white font-bold text-xl">Encaissement enregistré !</p>
        <p className="text-success font-semibold text-2xl mt-2">{formatEurDecimal(grossAmount)}</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-12 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2"
          >
            <ChevronLeft size={18} className="text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Nouvel encaissement</h1>
        </div>

        {/* Amount — big and central */}
        <div className="bg-surface rounded-2xl border border-border p-6 mb-4 text-center">
          <p className="text-muted text-xs mb-3 uppercase tracking-wider">Montant encaissé (€)</p>
          <div className="flex items-center justify-center gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent text-5xl font-bold text-white text-center w-full placeholder-surface-3 outline-none"
              style={{ caretColor: '#C9A84C' }}
            />
          </div>
          {feeInfo.rate > 0 && grossAmount > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted">Frais {feeInfo.label}</span>
                <span className="text-warning">−{formatEurDecimal(feeAmount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted">Montant net reçu</span>
                <span className="text-white font-semibold">{formatEurDecimal(netAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-muted text-xs uppercase tracking-wider mb-2">
            Description
          </label>
          <input
            type="text"
            placeholder="Ex: Mission design logo, Coaching session…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-surface-2 border border-border rounded-2xl px-4 py-3.5 text-white text-sm placeholder-muted outline-none focus:border-gold transition-colors"
          />
        </div>

        {/* Date */}
        <div className="mb-4">
          <label className="block text-muted text-xs uppercase tracking-wider mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="w-full bg-surface-2 border border-border rounded-2xl px-4 py-3.5 text-white text-sm outline-none focus:border-gold transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-muted text-xs uppercase tracking-wider mb-2">Catégorie</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(INCOME_CATEGORIES) as [IncomeCategory, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-3 py-3 rounded-xl text-xs font-medium text-left transition-all
                  ${category === key
                    ? 'bg-gold/15 border border-gold text-gold'
                    : 'bg-surface-2 border border-border text-muted'
                  }`}
              >
                {getCategoryEmoji(key)} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment method */}
        <div className="mb-8">
          <label className="block text-muted text-xs uppercase tracking-wider mb-2">
            Mode de paiement
          </label>
          <div className="space-y-2">
            {(Object.entries(PLATFORM_FEES) as [PaymentMethod, { label: string; rate: number }][]).map(
              ([key, info]) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all
                    ${paymentMethod === key
                      ? 'bg-gold/15 border border-gold'
                      : 'bg-surface-2 border border-border'
                    }`}
                >
                  <span className={paymentMethod === key ? 'text-gold font-medium' : 'text-white'}>
                    {info.label}
                  </span>
                  <span className={`text-xs ${info.rate > 0 ? 'text-warning' : 'text-muted'}`}>
                    {info.rate > 0 ? `−${(info.rate * 100).toFixed(2).replace('.', ',')}%` : 'Sans frais'}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full py-4 rounded-2xl bg-gold text-bg font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-98"
        >
          Enregistrer {grossAmount > 0 ? formatEurDecimal(grossAmount) : ''}
        </button>
      </div>
    </AppShell>
  );
}

function getCategoryEmoji(cat: string): string {
  const map: Record<string, string> = {
    prestation: '🔧',
    consulting: '💼',
    formation: '📚',
    vente_produit: '📦',
    marketplace: '🛍️',
    autre: '💳',
  };
  return map[cat] ?? '💳';
}
