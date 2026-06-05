'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import AppShell from '@/components/AppShell';
import { IncomeEntry, InvoiceLine, LineCategory, PaymentMethod, PLATFORM_FEES } from '@/lib/types';
import { formatEurDecimal } from '@/lib/calculations';
import { ChevronLeft, Check, Plus, Trash2 } from 'lucide-react';

function emptyLine(): InvoiceLine {
  return { id: crypto.randomUUID(), description: '', category: 'services', amount: 0 };
}

export default function NewIncomePage() {
  const router = useRouter();
  const { addEntry, entries } = useStore();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [clientName, setClientName] = useState('');
  const [invoiceRef, setInvoiceRef] = useState(() => {
    const year = new Date().getFullYear();
    const count = entries.filter(e => new Date(e.date).getFullYear() === year).length;
    return `${year}-${String(count + 1).padStart(3, '0')}`;
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('virement');
  const [lines, setLines] = useState<InvoiceLine[]>([emptyLine()]);
  const [submitted, setSubmitted] = useState(false);

  const feeInfo      = PLATFORM_FEES[paymentMethod];
  const totalLine    = lines.reduce((s, l) => s + (l.amount || 0), 0);
  const feeAmt       = totalLine * feeInfo.rate;
  const netTotal     = totalLine - feeAmt;
  const servicesTotal = lines.filter(l => l.category === 'services').reduce((s, l) => s + l.amount, 0);
  const salesTotal    = lines.filter(l => l.category === 'sales').reduce((s, l) => s + l.amount, 0);
  const isValid       = lines.some(l => l.description.trim() && l.amount > 0);

  const updateLine = (id: string, patch: Partial<InvoiceLine>) =>
    setLines(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  const removeLine = (id: string) =>
    setLines(prev => prev.filter(l => l.id !== id));
  const addLine = () =>
    setLines(prev => [...prev, emptyLine()]);

  const handleSubmit = () => {
    if (!isValid) return;
    const validLines = lines.filter(l => l.description.trim() && l.amount > 0);
    const gross = validLines.reduce((s, l) => s + l.amount, 0);
    const fee   = gross * feeInfo.rate;
    const entry: IncomeEntry = {
      id: crypto.randomUUID(),
      date,
      clientName: clientName.trim() || undefined,
      invoiceRef: invoiceRef.trim() || undefined,
      lines: validLines,
      grossAmount: gross,
      netAmount: gross - fee,
      paymentMethod,
      platformFeeRate: feeInfo.rate,
      platformFeeAmount: fee,
      createdAt: new Date().toISOString(),
    };
    addEntry(entry);
    setSubmitted(true);
    setTimeout(() => router.replace('/dashboard'), 1200);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-bg flex flex-col items-center justify-center gap-3">
        <div className="w-20 h-20 rounded-full bg-success/20 border-2 border-success flex items-center justify-center">
          <Check size={36} className="text-success" />
        </div>
        <p className="text-text font-bold text-xl">Encaissement enregistré !</p>
        <p className="text-success font-bold text-2xl">{formatEurDecimal(totalLine)}</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="px-4 pt-10 pb-8 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-2">
            <ChevronLeft size={18} className="text-text" />
          </button>
          <h1 className="text-xl font-bold text-text">Nouvel encaissement</h1>
        </div>

        {/* Date */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">Date</label>
          <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
            className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text text-sm focus:border-purple transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Client + Invoice ref */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-muted text-xs uppercase tracking-widest mb-2">Client</label>
            <input type="text" placeholder="Nom ou raison sociale du client"
              value={clientName} onChange={e => setClientName(e.target.value)}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text text-sm placeholder-muted focus:border-purple transition-colors"
            />
          </div>
          <div>
            <label className="block text-muted text-xs uppercase tracking-widest mb-2">Référence facture</label>
            <input type="text" placeholder={`${new Date().getFullYear()}-001`}
              value={invoiceRef} onChange={e => setInvoiceRef(e.target.value)}
              className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-text text-sm placeholder-muted focus:border-purple transition-colors"
            />
          </div>
        </div>

        {/* Lines */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-3">
            Lignes de facturation
          </label>
          <div className="flex flex-col gap-3">
            {lines.map((line, i) => (
              <LineCard
                key={line.id}
                line={line}
                index={i}
                canDelete={lines.length > 1}
                onChange={patch => updateLine(line.id, patch)}
                onDelete={() => removeLine(line.id)}
              />
            ))}
          </div>
          <button onClick={addLine}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-purple/40 text-purple text-sm font-medium transition-colors"
            style={{ background: 'transparent' }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Ajouter une ligne
          </button>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-muted text-xs uppercase tracking-widest mb-2">
            Mode de paiement
          </label>
          <div className="flex flex-col gap-1.5">
            {(Object.entries(PLATFORM_FEES) as [PaymentMethod, { label: string; rate: number }][]).map(([key, info]) => (
              <button key={key} onClick={() => setPaymentMethod(key)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all"
                style={paymentMethod === key
                  ? { background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.5)' }
                  : { background: '#1E1A2E', border: '1px solid #2D2848' }}
              >
                <span style={{ color: paymentMethod === key ? '#A78BFA' : '#FAF5FF', fontWeight: paymentMethod === key ? 500 : 400 }}>
                  {info.label}
                </span>
                <span className={`text-xs ${info.rate > 0 ? 'text-warning' : 'text-muted'}`}>
                  {info.rate > 0 ? `−${(info.rate * 100).toFixed(2).replace('.', ',')}%` : 'Sans frais'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Total summary */}
        {totalLine > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-2">
            {servicesTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Prestations de services</span>
                <span className="text-text">{formatEurDecimal(servicesTotal)}</span>
              </div>
            )}
            {salesTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Vente de marchandises</span>
                <span className="text-text">{formatEurDecimal(salesTotal)}</span>
              </div>
            )}
            {servicesTotal > 0 && salesTotal > 0 && <div className="border-t border-border" />}
            {feeAmt > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Frais {feeInfo.label}</span>
                <span className="text-warning">−{formatEurDecimal(feeAmt)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline">
              <span className="text-text font-semibold">Total</span>
              <span className="text-text font-bold text-lg">{formatEurDecimal(totalLine)}</span>
            </div>
            {feeAmt > 0 && (
              <div className="flex justify-between text-xs text-muted">
                <span>Net reçu</span>
                <span>{formatEurDecimal(netTotal)}</span>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={!isValid}
          className="w-full py-4 rounded-2xl font-bold text-sm text-white disabled:opacity-30 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', boxShadow: isValid ? '0 4px 20px rgba(139,92,246,0.35)' : 'none' }}
        >
          Enregistrer{totalLine > 0 ? ` ${formatEurDecimal(totalLine)}` : ''}
        </button>

      </div>
    </AppShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function LineCard({ line, index, canDelete, onChange, onDelete }: {
  line: InvoiceLine; index: number; canDelete: boolean;
  onChange: (p: Partial<InvoiceLine>) => void; onDelete: () => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs font-medium uppercase tracking-widest">Ligne {index + 1}</span>
        {canDelete && (
          <button onClick={onDelete} className="text-muted hover:text-danger transition-colors">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <input type="text"
        placeholder="Description (ex: Développement web, Produit artisanal…)"
        value={line.description}
        onChange={e => onChange({ description: e.target.value })}
        className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 text-text text-sm placeholder-muted focus:border-purple transition-colors"
      />

      <div className="flex gap-2">
        <CatBtn active={line.category === 'services'} label="Prestation de service"
          onClick={() => onChange({ category: 'services' })} />
        <CatBtn active={line.category === 'sales'} label="Vente de marchandise"
          onClick={() => onChange({ category: 'sales' })} />
      </div>

      <div className="relative">
        <input type="number" inputMode="decimal" placeholder="0,00"
          value={line.amount || ''}
          onChange={e => onChange({ amount: parseFloat(e.target.value) || 0 })}
          className="w-full bg-surface-2 border border-border rounded-xl px-3 py-2.5 pr-8 text-text text-sm placeholder-muted focus:border-purple transition-colors"
          style={{ caretColor: '#8B5CF6' }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
      </div>
    </div>
  );
}

function CatBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-1 py-2 px-2 rounded-xl text-xs font-medium transition-all text-center"
      style={active
        ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.5)', color: '#A78BFA' }
        : { background: '#2A2540', border: '1px solid #2D2848', color: '#9B8EC4' }}
    >
      {label}
    </button>
  );
}
